const form = document.querySelector('#rsvp-form');
const result = document.querySelector('#form-result');
const guestDetails = document.querySelector('#guest-details');
const additionalGuests = document.querySelector('#additional-guests');
const additionalGuestFields = document.querySelector('#additional-guest-fields');
function updateGuestNames() {
  const attending = form.elements.attendance.value === 'Joyfully accepts';
  const count = attending ? Number(form.elements.guests.value) - 1 : 0;
  const previous = [...additionalGuestFields.querySelectorAll('input')].map(input => input.value);
  additionalGuestFields.replaceChildren();
  additionalGuests.hidden = count === 0;
  for (let index = 0; index < count; index++) {
    const label = document.createElement('label');
    label.textContent = `Guest ${index + 2} full name`;
    const input = document.createElement('input');
    input.name = `companion${index + 2}`;
    input.placeholder = 'First and last name';
    input.required = true;
    input.maxLength = 80;
    input.value = previous[index] || '';
    label.append(input);
    additionalGuestFields.append(label);
  }
}
// Include companion names in the existing message column so the deployed
// Apps Script can record them without requiring a new deployment.
form.addEventListener('formdata', event => {
  const names = [...additionalGuestFields.querySelectorAll('input')].map(input => input.value.trim());
  if (names.length) {
    const note = event.formData.get('message') || '';
    event.formData.set('message', `Accompanying guests:\n${names.map((name, index) => `Guest ${index + 2}: ${name}`).join('\n')}\n\nNote: ${note}`);
  }
});
let currentReply = null;
const rsvpEndpoint = window.WEDDING_RSVP?.endpoint || '';
const onlineRsvp = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(rsvpEndpoint);
if (onlineRsvp) {
  form.action = rsvpEndpoint;
  form.querySelector('[type="submit"]').textContent = 'Confirm my attendance ↗';
  document.querySelector('#rsvp-delivery-note').textContent = 'Your reply will be saved to the couple’s RSVP list. If attending, a calendar invitation will be emailed to you. Google opens a new tab with the result.';
}

form.addEventListener('reset', () => {
  try { localStorage.removeItem('benj-rosette-rsvp-draft'); } catch (_) {}
  currentReply = null;
  result.hidden = true;
  guestDetails.hidden = false;
  form.elements.guests.disabled = false;
  form.elements.dietary.disabled = false;
  additionalGuestFields.replaceChildren();
  additionalGuests.hidden = true;
  setTimeout(updateGuestNames, 0);
});

form.addEventListener('change', (event) => {
  const attending = form.elements.attendance.value === 'Joyfully accepts';
  guestDetails.hidden = !attending;
  form.elements.guests.disabled = !attending;
  form.elements.dietary.disabled = !attending;
  if (event.target === form || event.target === form.elements.guests || event.target?.name === 'attendance') updateGuestNames();
});

form.addEventListener('submit', (event) => {
  if (!form.reportValidity()) { event.preventDefault(); return; }
  if (onlineRsvp) {
    form.elements.requestId.value = crypto.randomUUID();
    result.querySelector('strong').textContent = 'Check the confirmation tab';
    result.querySelector('p').textContent = 'Google will confirm whether your RSVP was saved and your calendar invitation was sent. If no tab opens, please allow this form to open a new tab and submit again.';
    document.querySelector('#download-rsvp').hidden = true;
    result.hidden = false;
    return;
  }
  event.preventDefault();
  currentReply = Object.fromEntries(new FormData(form).entries());
  if (currentReply.attendance === 'Regretfully declines') currentReply.guests = '0';
  try { localStorage.setItem('benj-rosette-rsvp-draft', JSON.stringify(currentReply)); } catch (_) {
    result.querySelector('p').textContent = 'Your RSVP is ready. Download it below and send it to Benj and Rosette to confirm your attendance.';
  }
  result.hidden = false;
  result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' });
});

document.querySelector('#download-rsvp').addEventListener('click', () => {
  if (!currentReply) return;
  const reply = `RSVP — Benj & Rosette\nDecember 15, 2026 · 2:00 PM\nCeremony: Saint Joseph the Worker Chapel, Pedro Reyes St., Imus, 4103 Cavite\nReception: Priscilla Crystal Palace, CV6R+JP6, Kawit, 4104 Cavite (following the ceremony)\n\nName: ${currentReply.name}\nEmail: ${currentReply.email}\nResponse: ${currentReply.attendance}\nGuests: ${currentReply.guests}\nDietary requirements: ${currentReply.dietary || 'None'}\n\nA note for the couple:\n${currentReply.message || 'With love!'}\n`;
  const url = URL.createObjectURL(new Blob([reply], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Benj-and-Rosette-RSVP.txt';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

try {
  const saved = JSON.parse(localStorage.getItem('benj-rosette-rsvp-draft') || 'null');
  if (saved && typeof saved === 'object') {
    for (const [name, value] of Object.entries(saved)) {
      if (form.elements[name] && typeof value === 'string') form.elements[name].value = value;
    }
    form.dispatchEvent(new Event('change'));
  }
} catch (_) { /* A draft is optional; the form remains usable without storage. */ }

// Expose the same local draft action to browsers with WebMCP support.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'create_rsvp_draft',
      title: 'Create a wedding RSVP draft',
      description: 'Create a local RSVP draft when online submission is not configured. For online RSVP, use the visible form.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          attendance: { type: 'string', enum: ['Joyfully accepts', 'Regretfully declines'] },
          guests: { type: 'integer', minimum: 1, maximum: 4 },
          dietary: { type: 'string', maxLength: 300 },
          message: { type: 'string', maxLength: 1000 }
        },
        required: ['name', 'email', 'attendance'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (onlineRsvp) throw new Error('Please use the visible RSVP form to confirm attendance and receive your calendar invitation.');
        if (!input || typeof input !== 'object') throw new Error('An RSVP reply is required.');
        if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100) throw new Error('Please provide your full name.');
        const emailCheck = document.createElement('input');
        emailCheck.type = 'email'; emailCheck.required = true;
        emailCheck.value = typeof input.email === 'string' ? input.email : '';
        if (!emailCheck.checkValidity()) throw new Error('Please provide a valid email address.');
        if (!['Joyfully accepts', 'Regretfully declines'].includes(input.attendance)) throw new Error('Please choose an attendance response.');
        if (input.guests !== undefined && (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 4)) throw new Error('Choose between one and four guests.');
        for (const [key, max] of [['dietary', 300], ['message', 1000]]) {
          if (input[key] !== undefined && (typeof input[key] !== 'string' || input[key].length > max)) throw new Error('Please shorten your ' + key + '.');
        }
        for (const key of ['name', 'email', 'attendance', 'dietary', 'message']) form.elements[key].value = input[key] || '';
        form.elements.guests.value = String(input.guests || 1);
        form.dispatchEvent(new Event('change'));
        form.requestSubmit();
        return { status: 'draft_created', attendance: currentReply.attendance, guests: Number(currentReply.guests), delivery: 'Download and share your reply with the couple.' };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
  } catch (_) { /* The visible RSVP works in browsers without this optional API. */ }
}

// The ceremony is at 2 PM in the Philippines (UTC+08:00).
const weddingTimestamp = Date.parse('2026-12-15T14:00:00+08:00');
function updateCountdown(now = Date.now()) {
  const remaining = Math.max(0, Math.floor((weddingTimestamp - now) / 1000));
  const values = {
    days: Math.floor(remaining / 86400),
    hours: Math.floor(remaining % 86400 / 3600),
    minutes: Math.floor(remaining % 3600 / 60),
    seconds: remaining % 60
  };
  for (const [unit, value] of Object.entries(values)) {
    document.querySelector('#countdown-' + unit).textContent = String(value).padStart(2, '0');
  }
  document.querySelector('#countdown-message').hidden = remaining > 0;
}
updateCountdown();
const countdownInterval = setInterval(updateCountdown, 1000);
window.addEventListener('pagehide', () => clearInterval(countdownInterval), { once: true });
const rsvpDialog = document.querySelector('#rsvp-dialog');
document.querySelector('#open-rsvp').addEventListener('click', () => rsvpDialog.showModal());
document.querySelector('#close-rsvp').addEventListener('click', () => rsvpDialog.close());
