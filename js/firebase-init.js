/* =========================================================
   ReadWell — loads Firebase (a "module" script)
   Firebase is loaded straight from Google's servers, so there is
   nothing to install and no build step. The tools it loads are handed
   to the rest of the site through RW.fbReady (see firebase-config.js).
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
    getAuth, setPersistence, browserSessionPersistence,
    GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    sendPasswordResetEmail, signOut, updateProfile, updatePassword,
    verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

try {
    const app = initializeApp(window.RW.firebaseConfig);
    const auth = getAuth(app);
    // Signed in only while this tab is open, like the rest of ReadWell's sessions.
    await setPersistence(auth, browserSessionPersistence);

    window.RW._fbResolve({
        app, auth,
        GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo,
        createUserWithEmailAndPassword, signInWithEmailAndPassword,
        sendPasswordResetEmail, signOut, updateProfile, updatePassword,
        verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider
    });
} catch (error) {
    window.RW._fbReject(error);
}
