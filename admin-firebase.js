/* Cyber Web Development — admin-only Firebase Auth helper.

   cwdIsAdmin() in auth.js just checks "is this the admin email, as typed into
   the casual visitor login" — that proves nothing to the database, since it's
   only stored in the visitor's own browser. Firestore only trusts a real
   signed-in Firebase session, which is what this file establishes. It's a
   second, stronger gate that sits in front of demandes/coupons specifically.
*/

function cwdFirebaseSignIn(email, password) {
  return cwdAuth.signInWithEmailAndPassword(email, password);
}

function cwdFirebaseSignOut() {
  return cwdAuth.signOut();
}

/* Resolves with the current Firebase user (or null) once Firebase has
   finished checking its persisted session — call this before deciding
   whether to show the sign-in form. */
function cwdFirebaseWaitForAuthState() {
  return new Promise(function (resolve) {
    const unsubscribe = cwdAuth.onAuthStateChanged(function (user) {
      unsubscribe();
      resolve(user);
    });
  });
}

/* Renders a small sign-in form into `containerEl` and resolves once the
   admin has successfully signed in. */
function cwdRenderFirebaseSignIn(containerEl, adminEmail) {
  return new Promise(function (resolve) {
    containerEl.innerHTML =
      '<div class="fb-signin-box">' +
        '<p class="fb-signin-title">Connexion base de données</p>' +
        '<p class="fb-signin-note">Confirmez votre mot de passe admin pour charger les données.</p>' +
        '<input type="email" id="fb-email" value="' + adminEmail + '" readonly>' +
        '<input type="password" id="fb-password" placeholder="Mot de passe">' +
        '<button id="fb-signin-btn">Se connecter</button>' +
        '<p class="fb-signin-error" id="fb-signin-error"></p>' +
      '</div>';

    const btn = containerEl.querySelector('#fb-signin-btn');
    const pwInput = containerEl.querySelector('#fb-password');
    const errEl = containerEl.querySelector('#fb-signin-error');

    function attempt() {
      btn.disabled = true;
      btn.textContent = 'Connexion...';
      errEl.textContent = '';
      cwdFirebaseSignIn(adminEmail, pwInput.value)
        .then(function () {
          resolve();
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.textContent = 'Se connecter';
          errEl.textContent = "Mot de passe incorrect ou compte non configuré.";
        });
    }

    btn.addEventListener('click', attempt);
    pwInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attempt();
    });
  });
}
