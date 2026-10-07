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
function createRsvpRequestId() {
  // randomUUID is unavailable on HTTP while a custom domain's TLS is pending.
  // getRandomValues works there too; this ID is for deduplication, not access.
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const rsvpEndpoint = window.WEDDING_RSVP?.endpoint || '';
const onlineRsvp = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(rsvpEndpoint);
if (onlineRsvp) {
  form.action = rsvpEndpoint;
  form.querySelector('[type="submit"]').textContent = 'Confirm my attendance ↗';
  document.querySelector('#rsvp-delivery-note').textContent = 'Your reply will be saved to the couple’s RSVP list. If attending and you provide an email, a calendar invitation will be emailed to you. Google opens a new tab with the result.';
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
    try {
      form.elements.requestId.value = createRsvpRequestId();
    } catch (_) {
      event.preventDefault();
      result.querySelector('strong').textContent = 'Your reply has not been sent';
      result.querySelector('p').textContent = 'Please reload the invitation in an updated browser and try again, or contact the couple.';
      document.querySelector('#download-rsvp').hidden = true;
      result.hidden = false;
      return;
    }
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
  const reply = `RSVP — Benj & Rosette\nDecember 15, 2026 · 2:00 PM\nCeremony: Saint Joseph The Worker Chapel, Pedro Reyes St., Malagasang 1-G, Imus City, Cavite\nReception: Priscilla Crystal Palace, San Sebastian, Kawit, Cavite (4:00 PM)\n\nName: ${currentReply.name}\nEmail: ${currentReply.email}\nResponse: ${currentReply.attendance}\nGuests: ${currentReply.guests}\nDietary requirements: ${currentReply.dietary || 'None'}\n\nA note for the couple:\n${currentReply.message || 'With love!'}\n`;
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
        required: ['name', 'attendance'],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute(input) {
        if (onlineRsvp) throw new Error('Please use the visible RSVP form to confirm attendance and receive your calendar invitation.');
        if (!input || typeof input !== 'object') throw new Error('An RSVP reply is required.');
        if (typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100) throw new Error('Please provide your full name.');
        const emailCheck = document.createElement('input');
        emailCheck.type = 'email';
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

const weddingMusic = document.querySelector('#wedding-music');
const musicToggle = document.querySelector('#music-toggle');
const musicLabel = document.querySelector('#music-label');
const musicStatus = document.querySelector('#music-status');
weddingMusic.volume = 0.5;
let musicPlaying = false;
function updateMusicControl() {
  const playing = musicPlaying && !weddingMusic.paused;
  const requested = !weddingMusic.paused && !weddingMusic.error;
  musicToggle.setAttribute('aria-pressed', String(playing));
  musicToggle.setAttribute('aria-label', requested ? 'Pause wedding music' : 'Play wedding music');
  musicLabel.textContent = requested ? (playing ? 'Pause music' : 'Loading music…') : 'Play music';
}
async function playWeddingMusic() {
  musicStatus.hidden = true;
  weddingMusic.muted = false;
  // Some mobile browsers expose an explicit music playback audio session.
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) {}
  if (weddingMusic.error) weddingMusic.load();
  try { await weddingMusic.play(); } catch (error) {
    if (error.name === 'AbortError' && weddingMusic.paused) return;
    musicPlaying = false;
    musicStatus.textContent = error.name === 'NotAllowedError'
      ? 'Tap ♫ to start the music.'
      : 'Music could not load. Tap ♫ to try again.';
    musicStatus.hidden = false;
    updateMusicControl();
  }
}
musicToggle.addEventListener('click', () => {
  musicStatus.hidden = true;
  if (!weddingMusic.paused && !weddingMusic.error) { weddingMusic.pause(); return; }
  playWeddingMusic();
});
weddingMusic.addEventListener('playing', () => {
  musicPlaying = true;
  musicStatus.hidden = true;
  updateMusicControl();
});
weddingMusic.addEventListener('waiting', () => {
  musicPlaying = false;
  musicStatus.textContent = 'Loading music…';
  musicStatus.hidden = false;
  updateMusicControl();
});
weddingMusic.addEventListener('pause', () => {
  musicPlaying = false;
  musicStatus.hidden = true;
  updateMusicControl();
});
weddingMusic.addEventListener('error', () => {
  musicPlaying = false;
  musicStatus.textContent = 'Music could not load. Tap ♫ to try again.';
  musicStatus.hidden = false;
  updateMusicControl();
});
window.addEventListener('pagehide', () => weddingMusic.pause());

const weddingMenu = document.querySelector('#wedding-menu');
const menuToggle = document.querySelector('#open-menu');
menuToggle.addEventListener('click', () => {
  weddingMenu.querySelectorAll('nav a').forEach(link => {
    if (link.hash === (location.hash || '#home')) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  weddingMenu.showModal();
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-is-open');
});
document.querySelector('#close-menu').addEventListener('click', () => weddingMenu.close());
weddingMenu.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => weddingMenu.close()));
weddingMenu.addEventListener('click', event => {
  const bounds = weddingMenu.getBoundingClientRect();
  if (event.target === weddingMenu && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) weddingMenu.close();
});
weddingMenu.addEventListener('close', () => {
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-is-open');
});

const envelopeIntro = document.querySelector('#envelope-intro');
const openInvitation = document.querySelector('#open-invitation');
function startInvitationAnimations() {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  const photos = [...document.querySelectorAll('.couple-photo, .story-photo, .gift-photo-wrap')];
  const textSelectors = [
    '.opening blockquote', '.opening > .small-caps', '.love-story > p', '.love-story > h2',
    '.family-section > p', '.name-section > p', '.name-section > h1', '.invitation-message',
    '.wedding-date', '.countdown-section > h2', '.countdown',
    '.event > h2', '.event > h3', '.event > p', '.itinerary > h2', '.itinerary li', '.timing-note',
    '.entourage-section h2', '.entourage-section h3', '.entourage-section li',
    '.dress-section h2', '.dress-section h3', '.dress-section p', '.dress-palette li',
    '.gift-section > h2', '.gift-section > h3', '.gift-section > p',
    '.bank-qr-card h4', '.bank-qr-card figcaption', '.attendance-section > h2', '.attendance-section > p',
    '.thank-you > p', '.gentle-reminder > h2', '.gentle-reminder > p',
    '.wedding-faqs h2', '.faq-item h3', '.faq-item p', '.snap-and-share > h2', '.snap-and-share > p'
  ];
  const text = [...document.querySelectorAll(textSelectors.join(', '))];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const photo = entry.target;
      const image = photo.querySelector('img');
      const reveal = () => photo.classList.add(photo.classList.contains('text-motion-ready') ? 'text-in-view' : 'photo-in-view');
      if (!image || image.complete) reveal();
      else {
        image.addEventListener('load', reveal, { once: true });
        image.addEventListener('error', reveal, { once: true });
      }
      observer.unobserve(photo);
    });
  }, { threshold: 0.08 });
  photos.forEach(photo => {
    photo.classList.add('photo-motion-ready');
    observer.observe(photo);
  });
  text.forEach((element, index) => {
    element.style.setProperty('--text-reveal-delay', `${index % 3 * 110}ms`);
    element.classList.add('text-motion-ready');
    observer.observe(element);
  });
  motionPreference.addEventListener('change', event => {
    if (!event.matches) return;
    observer.disconnect();
    photos.forEach(photo => photo.classList.remove('photo-motion-ready', 'photo-in-view'));
    text.forEach(element => element.classList.remove('text-motion-ready', 'text-in-view'));
  }, { once: true });
}
if (envelopeIntro && openInvitation) {
  const invitationContents = [...document.body.children].filter(element => element !== envelopeIntro && !['SCRIPT', 'NOSCRIPT', 'AUDIO'].includes(element.tagName));
  invitationContents.forEach(element => { element.inert = true; });
  function afterEnvelopeTransition(element, property, fallbackMs, complete) {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(fallback);
      element.removeEventListener('transitionend', onEnd);
      element.removeEventListener('transitioncancel', onEnd);
      complete();
    };
    const onEnd = event => {
      if (event.target === element && event.propertyName === property) finish();
    };
    const fallback = window.setTimeout(finish, fallbackMs);
    element.addEventListener('transitionend', onEnd);
    element.addEventListener('transitioncancel', onEnd);
  }
  openInvitation.addEventListener('click', () => {
    openInvitation.disabled = true;
    // Start during the guest's click, before animation timers lose user activation.
    playWeddingMusic();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finishReveal = () => {
      envelopeIntro.hidden = true;
      invitationContents.forEach(element => { element.inert = false; });
      document.body.classList.remove('invitation-revealing');
      document.querySelector('#open-menu').focus({ preventScroll: true });
    };
    const revealInvitation = () => {
      document.querySelector('#home').scrollIntoView({ behavior: 'instant' });
      startInvitationAnimations();
      document.body.classList.add('invitation-revealing');
      document.body.classList.remove('invitation-closed');
      if (!reducedMotion) afterEnvelopeTransition(envelopeIntro, 'transform', 1400, finishReveal);
      envelopeIntro.classList.add('envelope-revealed');
      if (reducedMotion) finishReveal();
    };
    if (!reducedMotion) {
      afterEnvelopeTransition(envelopeIntro.querySelector('.envelope-letter'), 'transform', 1800, () => {
        window.setTimeout(revealInvitation, 200);
      });
    }
    envelopeIntro.classList.add('envelope-opening');
    if (reducedMotion) revealInvitation();
  }, { once: true });
} else startInvitationAnimations();
