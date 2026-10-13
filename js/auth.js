/* =========================================================
   ReadWell — simulated authentication
   PROTOTYPE ONLY: this demonstrates the sign-in flow. It is not
   production-grade authentication and must not protect real data.

   The signed-in user is kept in sessionStorage (cleared when the
   tab closes). Every lookup is re-validated against localStorage,
   and children are always fetched by the signed-in parent's id so
   one family never sees another family's data.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW;
    var store = RW.store;

    var SESSION_KEY = 'rw_session';
    var SELECTED_KEY = 'rw_selected_child';

    /* Functions, so the link is built after the page's data-root is known. */
    function parentHome() { return RW.url('parent/parent-dashboard.html#dashboard'); }
    function studentHome() { return RW.url('student/student-dashboard.html#home'); }

    /* ---------- session storage ---------- */

    function readSession() {
        try {
            var raw = global.sessionStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function writeSession(session) {
        try {
            global.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return true;
        } catch (e) {
            return false;
        }
    }

    function clearSession() {
        try {
            global.sessionStorage.removeItem(SESSION_KEY);
            global.sessionStorage.removeItem(SELECTED_KEY);
        } catch (e) { /* nothing to clear */ }
    }

    /* Returns { role: 'parent', parent } or { role: 'student', student }
       or null. An invalid or stale session is cleared. */
    function getSession() {
        var raw = readSession();
        if (raw && typeof raw === 'object') {
            if (raw.role === 'parent') {
                var parent = store.getParentById(raw.id);
                if (parent) { return { role: 'parent', parent: parent }; }
            } else if (raw.role === 'student') {
                var student = store.getStudentById(raw.id);
                if (student && store.getParentById(student.parentId)) {
                    return { role: 'student', student: student };
                }
            }
        }
        if (raw) { clearSession(); }
        return null;
    }

    /* ---------- actions ---------- */

    function normalizeEmail(email) {
        return String(email).trim().toLowerCase();
    }

    function registerParent(input) {
        var email = normalizeEmail(input.email);
        if (store.findParentByEmail(email)) {
            return {
                ok: false,
                field: 'email',
                error: 'An account with this email already exists. Try logging in instead.'
            };
        }
        var parent = store.addParent({
            name: String(input.name).trim(),
            email: email,
            password: input.password
        });
        if (!parent || !writeSession({ role: 'parent', id: parent.parentId })) {
            return {
                ok: false,
                error: 'We could not save your account. Your browser may be blocking local storage.'
            };
        }
        return { ok: true, parent: parent };
    }

    function loginParent(email, password) {
        var parent = store.findParentByEmail(normalizeEmail(email));
        var valid = parent && parent.passwordHash === store.hashPassword(password, parent.salt);
        if (!valid || !writeSession({ role: 'parent', id: parent.parentId })) {
            return { ok: false, error: 'The email or password is not correct. Check them and try again.' };
        }
        return { ok: true, parent: parent };
    }

    function loginStudent(username, pin) {
        var student = store.findStudentByUsername(username);
        var valid = student &&
            store.checkPin(student, pin) &&
            store.getParentById(student.parentId);
        if (!valid || !writeSession({ role: 'student', id: student.studentId })) {
            return { ok: false, error: 'The username or PIN is not correct. Check them and try again.' };
        }
        return { ok: true, student: student };
    }

    /* Prototype recovery: the parent proves ownership with the recovery code.
       The message is deliberately the same whether the email or the code is wrong. */
    function resetPassword(email, code, newPassword) {
        var parent = store.resetPassword(normalizeEmail(email), code, newPassword);
        if (!parent) {
            return { ok: false, error: 'The email or recovery code is not correct. Check them and try again.' };
        }
        return { ok: true };
    }

    function logout() {
        clearSession();
        global.location.href = RW.url('index.html');
    }

    /* ---------- page guards ---------- */

    function requireParent() {
        var session = getSession();
        if (session && session.role === 'parent') { return session.parent; }
        global.location.replace(session ? studentHome() : RW.url('parent/parent-login.html'));
        return null;
    }

    function requireStudent() {
        var session = getSession();
        if (session && session.role === 'student') { return session.student; }
        global.location.replace(session ? parentHome() : RW.url('student/student-login.html'));
        return null;
    }

    /* Used by login/register pages. Returns true when it redirected.
       Only redirects when the signed-in role matches `role`, so a student
       signed in on a shared computer can still reach the parent login. */
    function redirectIfSignedIn(role) {
        var session = getSession();
        if (!session || (role && session.role !== role)) { return false; }
        global.location.replace(session.role === 'parent' ? parentHome() : studentHome());
        return true;
    }

    function dashboardUrl(session) {
        if (!session) { return null; }
        return session.role === 'parent' ? parentHome() : studentHome();
    }

    /* ---------- selected child (parent dashboard) ---------- */

    function getSelectedChildId(parentId) {
        try {
            var id = global.sessionStorage.getItem(SELECTED_KEY);
            if (!id) { return null; }
            var student = store.getStudentById(id);
            return student && student.parentId === parentId ? id : null;
        } catch (e) {
            return null;
        }
    }

    function setSelectedChildId(id) {
        try { global.sessionStorage.setItem(SELECTED_KEY, id); } catch (e) { /* ignore */ }
    }

    /* ---------- Part 3: parent account changes ---------- */

    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /* Changing the email needs the current password. The parent stays signed in. */
    function changeParentEmail(parentId, currentPassword, newEmail) {
        var email = normalizeEmail(newEmail);
        if (!store.checkParentPassword(parentId, currentPassword)) {
            return { ok: false, field: 'current', error: 'The current password is not correct.' };
        }
        if (!EMAIL_PATTERN.test(email)) {
            return { ok: false, field: 'email', error: 'Enter a valid email, like name@example.com.' };
        }
        var existing = store.findParentByEmail(email);
        if (existing && existing.parentId !== parentId) {
            return { ok: false, field: 'email', error: 'Another account already uses this email.' };
        }
        if (!store.updateParentEmail(parentId, email)) {
            return { ok: false, error: 'We could not save the change. Your browser may be blocking local storage.' };
        }
        return { ok: true, email: email };
    }

    function changeParentPassword(parentId, currentPassword, newPassword, confirmPassword) {
        if (!store.checkParentPassword(parentId, currentPassword)) {
            return { ok: false, field: 'current', error: 'The current password is not correct.' };
        }
        if (String(newPassword).length < 8) {
            return { ok: false, field: 'new', error: 'Your new password needs at least 8 characters.' };
        }
        if (newPassword === currentPassword) {
            return { ok: false, field: 'new', error: 'Choose a password that is different from the current one.' };
        }
        if (newPassword !== confirmPassword) {
            return { ok: false, field: 'confirm', error: 'The two new passwords do not match.' };
        }
        if (!store.updateParentPassword(parentId, newPassword)) {
            return { ok: false, error: 'We could not save the change. Your browser may be blocking local storage.' };
        }
        return { ok: true };
    }

    /* ---------- Part 3: student account controls (parent only) ---------- */

    var PIN_PATTERN = /^[0-9]{4}$/;
    var USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

    function ownChild(parentId, studentId) {
        var s = store.getStudentById(studentId);
        return s && s.parentId === parentId ? s : null;
    }

    function changeStudentUsername(parentId, studentId, rawUsername) {
        var username = String(rawUsername).trim().toLowerCase();
        if (!ownChild(parentId, studentId)) { return { ok: false, error: 'That child profile was not found.' }; }
        if (!USERNAME_PATTERN.test(username)) {
            return { ok: false, error: 'Use 3 to 20 letters, numbers or underscores (no spaces).' };
        }
        var taken = store.findStudentByUsername(username);
        if (taken && taken.studentId !== studentId) {
            return { ok: false, error: 'That username is already used. Try another one.' };
        }
        var saved = store.setStudentUsername(studentId, parentId, username);
        return saved ? { ok: true, student: saved } : { ok: false, error: 'We could not save the change.' };
    }

    /* customPin = a 4-digit string chosen by the parent, or null for a new generated PIN. */
    function resetStudentPin(parentId, studentId, customPin) {
        if (!ownChild(parentId, studentId)) { return { ok: false, error: 'That child profile was not found.' }; }
        if (customPin !== null && !PIN_PATTERN.test(String(customPin))) {
            return { ok: false, error: 'A PIN must be exactly 4 digits.' };
        }
        var saved = store.setStudentPin(studentId, parentId, customPin);
        return saved ? { ok: true, student: saved } : { ok: false, error: 'We could not save the change.' };
    }


    /* =====================================================
       Firebase sign-in for parents (replaces the simulated login).
       Everything here is asynchronous: each function returns a promise
       that resolves to { ok: true, ... } or { ok: false, error, field }.
       The old simulated functions above are kept only for the tests.
       ===================================================== */

    function firebase() { return RW.fbReady; }

    /* Turns a Firebase error code into a friendly message. */
    function fbProblem(err) {
        var code = err && err.code ? String(err.code) : '';
        var map = {
            'auth/email-already-in-use': { field: 'email', error: 'An account with this email already exists. Try logging in instead.' },
            'auth/invalid-email': { field: 'email', error: 'Enter a valid email, like name@example.com.' },
            'auth/weak-password': { field: 'password', error: 'Your password needs at least 8 characters.' },
            'auth/invalid-credential': { error: 'The email or password is not correct. Check them and try again.' },
            'auth/wrong-password': { error: 'The email or password is not correct. Check them and try again.' },
            'auth/user-not-found': { error: 'The email or password is not correct. Check them and try again.' },
            'auth/too-many-requests': { error: 'Too many tries. Please wait a few minutes, or reset your password.' },
            'auth/network-request-failed': { error: 'We could not reach the sign-in service. Check your internet connection and try again.' },
            'auth/popup-blocked': { error: 'Your browser blocked the Google window. Allow pop-ups for this site and try again.' },
            'auth/popup-closed-by-user': { cancelled: true, error: 'Google sign-in was closed before it finished.' },
            'auth/cancelled-popup-request': { cancelled: true, error: 'Google sign-in was closed before it finished.' },
            'auth/unauthorized-domain': { error: 'This website address is not allowed for sign-in yet. The site owner must add it in Firebase under Authentication, Settings, Authorized domains.' },
            'auth/requires-recent-login': { error: 'For safety, please log out, log in again, and then repeat this change.' },
            'auth/operation-not-allowed': { error: 'This sign-in method is not turned on yet in Firebase.' }
        };
        var hit = map[code] || { error: 'Something went wrong. Please try again.' };
        return { ok: false, field: hit.field, error: hit.error, cancelled: !!hit.cancelled, code: code };
    }

    /* Wraps a Firebase action: waits for Firebase, turns any error into a result. */
    function withFirebase(action) {
        return firebase().then(action).catch(function (err) {
            if (err && err.message === 'Firebase did not load') {
                return { ok: false, error: 'We could not reach the sign-in service. Check your internet connection and reload the page.' };
            }
            return fbProblem(err);
        });
    }

    /* Saves the local copy of the parent and starts the ReadWell session. */
    function startParentSession(user, nameHint, isNew) {
        var parent = store.upsertFirebaseParent(user.uid, nameHint || user.displayName, user.email);
        if (!parent || !writeSession({ role: 'parent', id: parent.parentId })) {
            return { ok: false, error: 'We could not save your account. Your browser may be blocking local storage.' };
        }
        return { ok: true, parent: parent, isNew: !!isNew };
    }

    function registerParentFirebase(input) {
        return withFirebase(function (fb) {
            var email = normalizeEmail(input.email);
            var name = String(input.name).trim();
            return fb.createUserWithEmailAndPassword(fb.auth, email, input.password).then(function (cred) {
                return fb.updateProfile(cred.user, { displayName: name }).catch(function () { /* name is also saved locally */ })
                    .then(function () { return startParentSession(cred.user, name, true); });
            });
        });
    }

    function loginParentFirebase(email, password) {
        return withFirebase(function (fb) {
            return fb.signInWithEmailAndPassword(fb.auth, normalizeEmail(email), password).then(function (cred) {
                return startParentSession(cred.user, null, false);
            });
        });
    }

    function loginParentGoogle() {
        return withFirebase(function (fb) {
            var provider = new fb.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            return fb.signInWithPopup(fb.auth, provider).then(function (cred) {
                var info = fb.getAdditionalUserInfo(cred);
                return startParentSession(cred.user, null, !!(info && info.isNewUser));
            });
        });
    }

    /* Sends a "reset your password" email. The answer is the same whether or not
       the address has an account, so nobody can use this to find out who is registered. */
    function sendPasswordReset(email) {
        return withFirebase(function (fb) {
            return fb.sendPasswordResetEmail(fb.auth, normalizeEmail(email)).then(
                function () { return { ok: true }; },
                function (err) {
                    var code = err && err.code;
                    if (code === 'auth/user-not-found') { return { ok: true }; }
                    throw err;
                });
        });
    }

    /* The ways this parent signs in, e.g. ['password'] or ['google.com']. */
    function parentProviders() {
        return firebase().then(function (fb) {
            return fb.auth.authStateReady().then(function () {
                var user = fb.auth.currentUser;
                return user ? user.providerData.map(function (p) { return p.providerId; }) : null;
            });
        }).catch(function () { return null; });
    }

    /* Changing email or password asks for the current password first. */
    function reauthenticate(fb, currentPassword) {
        var user = fb.auth.currentUser;
        if (!user || !user.email) { return Promise.reject({ code: 'auth/requires-recent-login' }); }
        return fb.reauthenticateWithCredential(user, fb.EmailAuthProvider.credential(user.email, currentPassword));
    }

    function changeParentEmailFirebase(currentPassword, newEmail) {
        var email = normalizeEmail(newEmail);
        if (!EMAIL_PATTERN.test(email)) { return Promise.resolve({ ok: false, field: 'email', error: 'Enter a valid email, like name@example.com.' }); }
        return withFirebase(function (fb) {
            return fb.auth.authStateReady().then(function () {
                return reauthenticate(fb, currentPassword);
            }).then(function () {
                // Firebase emails a link to the NEW address. The email changes when it is clicked.
                return fb.verifyBeforeUpdateEmail(fb.auth.currentUser, email);
            }).then(function () {
                return { ok: true, email: email };
            }, function (err) {
                var code = err && err.code;
                if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                    return { ok: false, field: 'current', error: 'The current password is not correct.' };
                }
                if (code === 'auth/email-already-in-use') {
                    return { ok: false, field: 'email', error: 'Another account already uses this email.' };
                }
                throw err;
            });
        });
    }

    function changeParentPasswordFirebase(currentPassword, newPassword, confirmPassword) {
        if (String(newPassword).length < 8) { return Promise.resolve({ ok: false, field: 'new', error: 'Your new password needs at least 8 characters.' }); }
        if (newPassword === currentPassword) { return Promise.resolve({ ok: false, field: 'new', error: 'Choose a password that is different from the current one.' }); }
        if (newPassword !== confirmPassword) { return Promise.resolve({ ok: false, field: 'confirm', error: 'The two new passwords do not match.' }); }
        return withFirebase(function (fb) {
            return fb.auth.authStateReady().then(function () {
                return reauthenticate(fb, currentPassword);
            }).then(function () {
                return fb.updatePassword(fb.auth.currentUser, newPassword);
            }).then(function () {
                return { ok: true };
            }, function (err) {
                var code = err && err.code;
                if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
                    return { ok: false, field: 'current', error: 'The current password is not correct.' };
                }
                throw err;
            });
        });
    }

    /* Clears the ReadWell session, signs out of Firebase, then goes to the home page. */
    function logoutEverywhere() {
        clearSession();
        var gone = false;
        function leave() {
            if (gone) { return; }
            gone = true;
            global.location.href = RW.url('index.html');
        }
        if (RW.fbReady) {
            RW.fbReady.then(function (fb) { return fb.signOut(fb.auth); }).catch(function () { /* nothing to sign out */ }).then(leave);
            global.setTimeout(leave, 1200);   // never leave the person stuck on a slow connection
        } else {
            leave();
        }
    }

    RW.auth = {
        getSession: getSession,
        registerParent: registerParent,
        loginParent: loginParent,
        loginStudent: loginStudent,
        resetPassword: resetPassword,
        changeParentEmail: changeParentEmail,
        changeParentPassword: changeParentPassword,
        changeStudentUsername: changeStudentUsername,
        resetStudentPin: resetStudentPin,
        logout: logoutEverywhere,
        registerParentFirebase: registerParentFirebase,
        loginParentFirebase: loginParentFirebase,
        loginParentGoogle: loginParentGoogle,
        sendPasswordReset: sendPasswordReset,
        parentProviders: parentProviders,
        changeParentEmailFirebase: changeParentEmailFirebase,
        changeParentPasswordFirebase: changeParentPasswordFirebase,
        requireParent: requireParent,
        requireStudent: requireStudent,
        redirectIfSignedIn: redirectIfSignedIn,
        dashboardUrl: dashboardUrl,
        getSelectedChildId: getSelectedChildId,
        setSelectedChildId: setSelectedChildId
    };
})(window);
