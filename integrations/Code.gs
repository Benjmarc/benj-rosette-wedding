const RSVP_CONFIG = {
  spreadsheetId: '1xePq4sAfklgYcFMY2u2T6E5dza5oxioVeURAAWZMSyA',
  sheetId: 74886443,
  calendarId: 'primary',
  start: '2026-12-15T14:00:00+08:00',
  end: '2026-12-15T20:00:00+08:00',
  location: 'Saint Joseph The Worker Chapel, Pedro Reyes St., Malagasang 1-G, Imus City, Cavite',
  title: 'Benj & Rosette — Wedding day'
};
const RSVP_HEADERS = ['Timestamp', 'Save the date!', 'Guest name', 'Email address', 'Number of guests', 'Dietary requirements', 'Message for the couple', 'Request ID', 'Calendar invitation', 'Calendar event ID'];

function doGet() {
  return receipt_('Wedding RSVP', 'Please submit your RSVP through Benj and Rosette’s wedding invitation.');
}
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const reply = validateReply_(e && e.parameter || {});
    lock.waitLock(30000);
    const sheet = SpreadsheetApp.openById(RSVP_CONFIG.spreadsheetId).getSheetById(RSVP_CONFIG.sheetId);
    if (!sheet) throw new Error('RSVP sheet is unavailable. Please contact the couple.');
    const headers = ensureHeaders_(sheet);
    const requestColumn = headers.indexOf('Request ID') + 1;
    const found = sheet.getLastRow() > 1 ? sheet.getRange(2, requestColumn, sheet.getLastRow() - 1, 1).createTextFinder(reply.requestId).matchEntireCell(true).findNext() : null;
    if (found) return receipt_('RSVP already received', 'Your previous reply is saved. Please contact the couple if you need to change it.');
    // One response per email prevents repeated submissions from sending repeated invitations.
    const emailColumn = headers.indexOf('Email address') + 1;
    const previous = reply.email && sheet.getLastRow() > 1 ? sheet.getRange(2, emailColumn, sheet.getLastRow() - 1, 1).createTextFinder(reply.email).matchEntireCell(true).matchCase(false).findNext() : null;
    if (previous) return receipt_('RSVP already received', 'A reply for this email address is already saved. Please contact the couple to change your response.');
    const values = {
      'Timestamp': new Date(), 'Save the date!': reply.attendance,
      'Guest name': safeCell_(reply.name), 'Email address': reply.email,
      'Number of guests': reply.guests, 'Dietary requirements': safeCell_(reply.dietary),
      'Message for the couple': safeCell_(reply.message), 'Request ID': reply.requestId,
      'Calendar invitation': reply.attendance === 'Joyfully accepts' ? (reply.email ? 'Pending' : 'No email provided') : 'Not attending',
      'Calendar event ID': ''
    };
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, headers.length).setValues([headers.map(h => values[h] === undefined ? '' : values[h])]);
    SpreadsheetApp.flush();
    if (reply.attendance === 'Regretfully declines') return receipt_('Your RSVP is saved', 'Thank you for letting Benj and Rosette know. No calendar invitation was sent.');
    if (!reply.email) return receipt_('Your attendance is confirmed', 'Your RSVP is saved. No calendar invitation was sent because no email address was provided.');
    try {
      const calendar = RSVP_CONFIG.calendarId === 'primary' ? CalendarApp.getDefaultCalendar() : CalendarApp.getCalendarById(RSVP_CONFIG.calendarId);
      if (!calendar) throw new Error('Wedding calendar is unavailable.');
      const event = calendar.createEvent(RSVP_CONFIG.title, new Date(RSVP_CONFIG.start), new Date(RSVP_CONFIG.end), {
        location: RSVP_CONFIG.location,
        description: 'Celebrate Benj and Rosette’s wedding. Ceremony at 2:00 PM, Philippine time. Reception at 4:00 PM at Priscilla Crystal Palace, San Sebastian, Kawit, Cavite. Wedding celebration from 2:00 PM to 8:00 PM Philippine time; individual reception activity timings will be confirmed.\n\nWedding invitation and details: https://benj-rosette-wedding.online/',
        guests: reply.email, sendInvites: true
      });
      event.setGuestsCanSeeGuests(false);
      event.setGuestsCanInviteOthers(false);
      sheet.getRange(row, headers.indexOf('Calendar event ID') + 1).setValue(event.getId());
      sheet.getRange(row, headers.indexOf('Calendar invitation') + 1).setValue('Sent');
      return receipt_('Your attendance is confirmed', 'Your RSVP is saved and a Google Calendar invitation has been sent to your email address. Please check your inbox and accept the invitation.');
    } catch (calendarError) {
      sheet.getRange(row, headers.indexOf('Calendar invitation') + 1).setValue('Needs follow-up');
      console.error(calendarError);
      return receipt_('Your RSVP is saved', 'Your reply was recorded, but we could not finish sending your calendar invitation. Please contact the couple for the invitation.');
    }
  } catch (error) {
    console.error(error);
    return receipt_('RSVP could not be completed', 'Please return to the invitation and check your details, or contact the couple. Your attendance has not been confirmed.');
  } finally { if (lock.hasLock()) lock.releaseLock(); }
}
function validateReply_(p) {
  const name = String(p.name || '').trim();
  const email = String(p.email || '').trim().toLowerCase();
  const attendance = String(p.attendance || '');
  const dietary = String(p.dietary || '').trim();
  const message = String(p.message || '').trim();
  const requestId = String(p.requestId || '');
  const guests = attendance === 'Regretfully declines' ? 0 : Number(p.guests);
  if (!name || name.length > 100 || (email && !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)) || email.length > 254) throw new Error('Invalid guest details');
  if (!['Joyfully accepts', 'Regretfully declines'].includes(attendance)) throw new Error('Invalid response');
  if (!Number.isInteger(guests) || guests < 0 || guests > 4 || attendance === 'Joyfully accepts' && guests < 1) throw new Error('Invalid guest count');
  if (dietary.length > 300 || message.length > 1000 || !/^[a-f0-9-]{36}$/i.test(requestId)) throw new Error('Invalid RSVP');
  if (p.website) throw new Error('Invalid submission');
  return {name, email, attendance, dietary, message, requestId, guests};
}
function ensureHeaders_(sheet) {
  const width = Math.max(1, sheet.getLastColumn());
  const headers = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
  if (sheet.getLastRow() === 0) headers.length = 0;
  RSVP_HEADERS.forEach(h => { if (!headers.includes(h)) headers.push(h); });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  return headers;
}
function safeCell_(value) { return /^[=+@\-\t\r\n]/.test(value) ? "'" + value : value; }
function receipt_(title, message) {
  const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const site = 'https://benj-rosette-wedding.online/';
  return HtmlService.createHtmlOutput(`<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(title)}</title><style>
*{box-sizing:border-box}body{margin:0;padding:32px 18px;background:#f5efe5;color:#50392d;font:18px/1.65 Georgia,serif;text-align:center}
.card{position:relative;max-width:720px;margin:4vh auto;padding:52px 40px 34px;border:1px solid #b59657;outline:1px solid #d8c7a4;outline-offset:-7px;background:linear-gradient(135deg,#f8f3ea,#f4ecdf);box-shadow:0 12px 40px #50392d0c}
.names{display:block;width:min(100%,460px);height:auto;margin:0 auto 26px}
.divider{display:flex;align-items:center;justify-content:center;gap:14px;color:#b59657;font-size:12px;margin:22px auto;width:min(70%,240px)}.divider:before,.divider:after{content:"";height:1px;background:#b59657;flex:1}
.eyebrow{color:#b59657;font-size:12px;letter-spacing:3px;text-transform:uppercase;margin:0 0 24px}
h1{font-weight:400;font-size:clamp(27px,5vw,38px);line-height:1.25;margin:0 0 22px}.message{max-width:560px;margin:0 auto 28px}
a{color:#a15c3c;text-underline-offset:4px}.contacts{display:flex;justify-content:center;gap:12px 24px;flex-wrap:wrap;margin:24px 0}.return{display:inline-block;border:1px solid #b59657;padding:10px 24px;text-decoration:none;color:#50392d}.return:hover{background:#e9ddc8}a:focus-visible{outline:2px solid #a15c3c;outline-offset:4px}
.footer{font-size:14px;font-style:italic;margin:24px 0 0;color:#766254}@media(max-width:480px){body{padding:20px 14px}.card{margin:2vh auto;padding:36px 22px 26px}.names{margin-bottom:22px}.contacts{flex-direction:column;gap:10px}}
</style></head><body><main class="card">
<img class="names" src="${site}benj-rosette-lettering.png" alt="Benj &amp; Rosette" width="2167" height="726">
<p class="eyebrow">December 15, 2026</p><div class="divider" aria-hidden="true">◆</div>
<h1>${escape(title)}</h1><p class="message">${escape(message)}</p>
<div class="divider" aria-hidden="true">◆</div>
<nav class="contacts" aria-label="Contact the couple"><a href="https://www.facebook.com/rosetteadrienne" target="_blank" rel="noopener">Contact the bride</a><a href="https://www.facebook.com/benjmarc/" target="_blank" rel="noopener">Contact the groom</a></nav>
<a class="return" href="${site}" target="_blank" rel="noopener">Return to invitation</a>
<p class="footer">You may close this tab and return to the invitation.</p>
</main></body></html>`);
}
