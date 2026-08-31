/* Cyber Web Development — client-side auth + email verification helper
   NOTE: this is a lightweight visitor gate, not real security.
   Everything (including the verification code) is stored in the
   visitor's own browser via localStorage. A technically determined
   person could read the code directly from their browser storage
   without ever opening the email. This is meant to stop typos and
   casual mistakes, not to provide real account security. If real
   security is ever needed, this needs a proper backend. */

const CWD_ADMIN_EMAIL = 'cyberweb.development02@gmail.com';
const CWD_SESSION_KEY = 'cwd_logged_in_email';
const CWD_PENDING_KEY = 'cwd_pending_verification';

const CWD_CODE_LENGTH = 8;
const CWD_CODE_EXPIRY_MS = 15 * 60 * 1000;   // 15 minutes
const CWD_RESEND_COOLDOWN_MS = 60 * 1000;    // 60 seconds between resend requests
const CWD_MAX_ATTEMPTS = 3;

/* ---- EmailJS setup required ----
   1. Sign up at https://www.emailjs.com with cyberweb.development02@gmail.com
   2. Add an Email Service, connect the same Gmail account -> copy the Service ID
   3. Create an Email Template with two variables: {{to_email}} and {{code}}
      (put {{code}} clearly in the body, e.g. "Votre code de vérification : {{code}}")
      -> copy the Template ID
   4. Account > General > copy your Public Key
   5. Paste all three below, replacing the placeholders.
*/
const CWD_EMAILJS_PUBLIC_KEY  = 'S63ztfOMDRKUmDNN-';
const CWD_EMAILJS_SERVICE_ID  = 'service_v3wwkmf';
const CWD_EMAILJS_TEMPLATE_ID = 'template_w03uxc6';

function cwdIsValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---- Session (logged in state) ---- */

function cwdGetLoggedInEmail() {
  return localStorage.getItem(CWD_SESSION_KEY);
}

function cwdLogin(email) {
  localStorage.setItem(CWD_SESSION_KEY, email.trim().toLowerCase());
}

function cwdLogout() {
  localStorage.removeItem(CWD_SESSION_KEY);
}

function cwdIsAdmin() {
  const email = cwdGetLoggedInEmail();
  return !!email && email === CWD_ADMIN_EMAIL.toLowerCase();
}

/* Renders the login/logout state into a nav element with id="auth-slot". */
function cwdRenderAuthSlot() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;
  const email = cwdGetLoggedInEmail();

  if (email) {
    let html = '';
    if (cwdIsAdmin()) {
      html += `<a href="admin.html" class="auth-admin-link">Admin</a>`;
    }
    html += `<a href="#" id="cwd-logout-link">${email} · Déconnexion</a>`;
    slot.innerHTML = html;
    const logoutLink = document.getElementById('cwd-logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', function (e) {
        e.preventDefault();
        cwdLogout();
        window.location.href = 'index.html';
      });
    }
  } else {
    slot.innerHTML = `<a href="login.html">Connexion</a>`;
  }
}

/* ---- Email verification codes ---- */

function cwdGenerateCode() {
  // 8-digit numeric code, always 8 digits (no leading-zero shrinkage)
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function cwdGetPendingVerification() {
  const raw = localStorage.getItem(CWD_PENDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function cwdSavePendingVerification(data) {
  localStorage.setItem(CWD_PENDING_KEY, JSON.stringify(data));
}

function cwdClearPendingVerification() {
  localStorage.removeItem(CWD_PENDING_KEY);
}

function cwdMsSinceLastSend() {
  const pending = cwdGetPendingVerification();
  if (!pending) return Infinity;
  return Date.now() - pending.lastSentAt;
}

function cwdCanResend() {
  return cwdMsSinceLastSend() >= CWD_RESEND_COOLDOWN_MS;
}

function cwdResendCooldownRemainingSeconds() {
  const remaining = CWD_RESEND_COOLDOWN_MS - cwdMsSinceLastSend();
  return Math.max(0, Math.ceil(remaining / 1000));
}

/* Generates a fresh code, stores it, and emails it via EmailJS.
   Returns the EmailJS send() promise. */
function cwdSendVerificationCode(email) {
  const cleanEmail = email.trim().toLowerCase();
  const code = cwdGenerateCode();

  cwdSavePendingVerification({
    email: cleanEmail,
    code: code,
    createdAt: Date.now(),
    lastSentAt: Date.now(),
    attempts: 0
  });

  return emailjs.send(CWD_EMAILJS_SERVICE_ID, CWD_EMAILJS_TEMPLATE_ID, {
    email: cleanEmail,
    passcode: code,
    time: cwdFormatExpiryTime()
  });
}

/* Same as above, but reuses the existing code/attempts if a resend
   happens before expiry — only resets the resend cooldown timer.
   (Keeps attempts count meaningful across resends within one session.) */
function cwdResendVerificationCode() {
  const pending = cwdGetPendingVerification();
  if (!pending) return Promise.reject(new Error('no_pending'));

  pending.lastSentAt = Date.now();
  cwdSavePendingVerification(pending);

  return emailjs.send(CWD_EMAILJS_SERVICE_ID, CWD_EMAILJS_TEMPLATE_ID, {
    email: pending.email,
    passcode: pending.code,
    time: cwdFormatExpiryTime()
  });
}

/* Formats a human-readable clock time 15 minutes from now, for the
   template's {{time}} variable (e.g. "14:35"). */
function cwdFormatExpiryTime() {
  const expiry = new Date(Date.now() + CWD_CODE_EXPIRY_MS);
  const hours = String(expiry.getHours()).padStart(2, '0');
  const minutes = String(expiry.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/* Checks a submitted code against the pending verification.
   Returns { success, reason, attemptsLeft?, email? }
   reason: 'ok' | 'no_pending' | 'expired_time' | 'expired_attempts' | 'wrong' */
function cwdVerifyCode(inputCode) {
  const pending = cwdGetPendingVerification();
  if (!pending) {
    return { success: false, reason: 'no_pending' };
  }

  if (Date.now() - pending.createdAt > CWD_CODE_EXPIRY_MS) {
    cwdClearPendingVerification();
    return { success: false, reason: 'expired_time' };
  }

  if (String(inputCode).trim() === String(pending.code)) {
    cwdLogin(pending.email);
    cwdClearPendingVerification();
    return { success: true, reason: 'ok', email: pending.email };
  }

  pending.attempts += 1;
  if (pending.attempts >= CWD_MAX_ATTEMPTS) {
    cwdClearPendingVerification();
    return { success: false, reason: 'expired_attempts' };
  }
  cwdSavePendingVerification(pending);
  return { success: false, reason: 'wrong', attemptsLeft: CWD_MAX_ATTEMPTS - pending.attempts };
}
