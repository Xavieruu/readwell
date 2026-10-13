/* =========================================================
   ReadWell — Firebase settings (loaded as a normal script)
   This config is NOT secret. It only tells the browser which Firebase
   project to talk to. What protects your data is Firebase's sign-in and
   (later) the Firestore security rules, not hiding these values.

   RW.fbReady is a promise that becomes the Firebase tools once
   js/firebase-init.js has loaded them. Pages wait for it before they
   sign anyone in. If Firebase cannot load in 10 seconds it is rejected,
   and the pages show a friendly "could not reach sign-in" message.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    RW.firebaseConfig = {
        apiKey: 'AIzaSyDFIiM62dpYu08_WXBrh9qt1BMDRvHewPo',
        authDomain: 'readwell-3fe81.firebaseapp.com',
        projectId: 'readwell-3fe81',
        storageBucket: 'readwell-3fe81.firebasestorage.app',
        messagingSenderId: '412434262549',
        appId: '1:412434262549:web:4f42d5a4ee711e1ad33c1c'
    };

    var resolveReady, rejectReady;
    RW.fbReady = new Promise(function (resolve, reject) {
        resolveReady = resolve;
        rejectReady = reject;
    });
    RW.fbReady.catch(function () { /* handled where it is used */ });
    RW._fbResolve = resolveReady;
    RW._fbReject = rejectReady;

    global.setTimeout(function () { rejectReady(new Error('Firebase did not load')); }, 10000);
})(window);
