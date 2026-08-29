/* Cyber Web Development — Firebase setup (shared database for demandes + coupons)

   ---- SETUP REQUIRED (one-time, ~10 min) ----
   1. Go to https://console.firebase.google.com -> Add project (the free "Spark" plan
      is enough for this site).
   2. Inside the project: click the </> (web app) icon to register a web app.
      No Firebase Hosting needed — you're still hosting on GitHub Pages.
   3. It will show you a `firebaseConfig` object. Copy those values into the object below.
   4. Left menu -> Build -> Firestore Database -> Create database -> start in
      **production mode** (not test mode).
   5. Left menu -> Build -> Authentication -> Get started -> Sign-in method tab ->
      enable **Email/Password**.
   6. Still in Authentication -> Users tab -> Add user -> use
      cyberweb.development02@gmail.com and choose a real password. Keep it somewhere
      safe (a password manager, not in this repo). This is the ONLY account that will
      ever be able to sign in and read the demandes/coupons lists — it is separate
      from, and stronger than, the casual email-code login visitors use.
   7. Firestore Database -> Rules tab -> replace the default rules with the contents
      of `firestore.rules.txt` (in this same folder), then click Publish.

   Without steps 1-7 done, admin.html and admin-coupons.html will show a
   connection error instead of data — that's expected until this is configured.
*/
const firebaseConfig = {
  apiKey: "AIzaSyDFBOx16KRLI6oHPDrN9DzbfPkPEjuouxo",
  authDomain: "cyberweb-development.firebaseapp.com",
  projectId: "cyberweb-development",
  storageBucket: "cyberweb-development.firebasestorage.app",
  messagingSenderId: "971490362399",
  appId: "1:971490362399:web:f8b87cb19dfeeb3617812a"
};

firebase.initializeApp(firebaseConfig);
const cwdDb = firebase.firestore();
const cwdAuth = firebase.auth();
