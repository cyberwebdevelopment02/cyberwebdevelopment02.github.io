/* Cyber Web Development — basic client-side auth helper
   NOTE: this is a lightweight visitor gate, not real security.
   Everything runs in the browser, so it should never be relied on
   to protect sensitive data — only to keep casual visitors out of
   pages that aren't meant for them yet. */

const CWD_ADMIN_EMAIL = 'cyberweb.development02@gmail.com';
const CWD_SESSION_KEY = 'cwd_logged_in_email';

function cwdIsValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

/* Renders the login/logout state into a nav element with id="auth-slot".
   Call this on any page that includes that element. */
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
