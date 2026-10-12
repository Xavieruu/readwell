/* =========================================================
   ReadWell — data layer (localStorage)
   PROTOTYPE ONLY: data lives in this browser and is not secure.

   localStorage keys:
     rw_parents     [ { parentId, name, email, salt, passwordHash, recoveryCode, createdAt } ]
     rw_students    [ { studentId, parentId, name, gradeLevel, school, readingLevel,
                        username, pinSalt, pinHash, displayPin, createdAt } ]
                      pinHash/pinSalt are what sign-in checks. displayPin is ONLY the
                      system-generated PIN the parent may view; it is '' once the parent
                      chooses their own PIN. A real backend (Part 4) must store only a
                      slow salted hash and never a viewable PIN.
     rw_activities  [ { activityId, studentId, storyId, title, difficulty, status,
                        attemptCount, startedAt, lastAttemptAt, completedAt } ]
     rw_attempts    [ { attemptId, studentId, storyId, difficulty, mode ('original'|'practice'),
                        baseAttemptId, status ('in_progress'|'completed'), currentIndex,
                        answers:[ { questionId, hintsUsed, submitted, firstAnswer, firstCorrect,
                                    tries, lastAnswer, solved } ],
                        summary, startedAt, completedAt } ]
                      A practice attempt is a NEW record; the original is never changed.
     rw_settings    { [studentId]: { textSize, lineSpacing, letterSpacing, displayMode,
                                     readingWidth, speechRate, difficulty, preset } }
     rw_bookmarks   { [studentId]: [ storyId, ... ] }
     rw_annotations { [studentId]: { [storyId]: { highlights:[{id,p,start,end,text,note}], storyNote } } }
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    var KEYS = {
        parents: 'rw_parents',
        students: 'rw_students',
        activities: 'rw_activities',
        attempts: 'rw_attempts',
        settings: 'rw_settings',
        annotations: 'rw_annotations',
        bookmarks: 'rw_bookmarks',
        aiTips: 'rw_ai_tips'
    };

    /* ---------- low-level helpers ---------- */

    function available() {
        try {
            var testKey = '__rw_test__';
            global.localStorage.setItem(testKey, '1');
            global.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    function readList(key) {
        try {
            var parsed = JSON.parse(global.localStorage.getItem(key));
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    }

    function readObject(key) {
        try {
            var parsed = JSON.parse(global.localStorage.getItem(key));
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (e) {
            return {};
        }
    }

    function write(key, value) {
        try {
            global.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return false;
        }
    }

    function ensure(key, emptyValue) {
        try {
            if (global.localStorage.getItem(key) === null) {
                write(key, emptyValue);
            }
        } catch (e) { /* storage unavailable: init() reports it */ }
    }

    function randomInt(max) {
        var c = global.crypto;
        if (c && c.getRandomValues) {
            var arr = new Uint32Array(1);
            c.getRandomValues(arr);
            return arr[0] % max;
        }
        return Math.floor(Math.random() * max);
    }

    function randomHex(bytes) {
        var out = '';
        for (var i = 0; i < bytes; i++) {
            out += ('0' + randomInt(256).toString(16)).slice(-2);
        }
        return out;
    }

    function nextId(prefix, list, field) {
        var max = 0;
        list.forEach(function (item) {
            var match = String(item[field] || '').match(/_(\d+)$/);
            if (match) { max = Math.max(max, parseInt(match[1], 10)); }
        });
        var num = String(max + 1);
        while (num.length < 3) { num = '0' + num; }
        return prefix + '_' + num;
    }

    /* Simple string hash (cyrb53). Good enough to avoid storing a plain
       password in this demo; it is NOT real password security. */
    function hashPassword(password, salt) {
        var str = salt + ':' + password;
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57, ch;
        for (var i = 0; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    }

    function makeUsername(name, students) {
        var base = String(name);
        if (base.normalize) {
            base = base.normalize('NFD').replace(/[̀-ͯ]/g, '');
        }
        base = base.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12) || 'student';

        var taken = {};
        students.forEach(function (s) { taken[String(s.username).toLowerCase()] = true; });

        var username, tries = 0;
        do {
            username = base + (100 + randomInt(900));
            tries++;
        } while (taken[username] && tries < 200);

        if (taken[username]) {
            username = base + String(Date.now()).slice(-6);
        }
        return username;
    }

    /* Stores a PIN as salt + hash. When the PIN was made by the system it is
       also kept in displayPin so a parent can read it out to their child. */
    function applyPin(student, pin, generated) {
        student.pinSalt = randomHex(8);
        student.pinHash = hashPassword(String(pin), student.pinSalt);
        student.displayPin = generated ? String(pin) : '';
        delete student.pin;
    }

    function makePin() {
        return ('0000' + randomInt(10000)).slice(-4);
    }

    /* Recovery code: shown to the parent at sign-up and in Settings.
       Format RW-XXXX-XXXX. Letters/digits that look alike are left out. */
    function makeRecoveryCode() {
        var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        function chunk() {
            var out = '';
            for (var i = 0; i < 4; i++) { out += alphabet.charAt(randomInt(alphabet.length)); }
            return out;
        }
        return 'RW-' + chunk() + '-' + chunk();
    }

    function normalizeCode(code) {
        return String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    /* Accounts created before recovery codes existed get one on demand. */
    function ensureRecoveryCode(parentId) {
        var parents = readList(KEYS.parents);
        for (var i = 0; i < parents.length; i++) {
            if (parents[i].parentId === parentId) {
                if (!parents[i].recoveryCode) {
                    parents[i].recoveryCode = makeRecoveryCode();
                    if (!write(KEYS.parents, parents)) { return null; }
                }
                return parents[i].recoveryCode;
            }
        }
        return null;
    }

    /* Returns the parent when email + recovery code match, otherwise null. */
    function resetPassword(email, code, newPassword) {
        var parents = readList(KEYS.parents);
        var wanted = String(email).trim().toLowerCase();
        for (var i = 0; i < parents.length; i++) {
            var p = parents[i];
            if (String(p.email).toLowerCase() === wanted &&
                p.recoveryCode &&
                normalizeCode(p.recoveryCode) === normalizeCode(code)) {
                p.salt = randomHex(8);
                p.passwordHash = hashPassword(newPassword, p.salt);
                return write(KEYS.parents, parents) ? p : null;
            }
        }
        return null;
    }

    /* Students saved before Part 3 had a plain "pin" field. Convert them. */
    function migrateStudents() {
        var list = readList(KEYS.students);
        var changed = false;
        list.forEach(function (s) {
            if (s.pin !== undefined) { applyPin(s, s.pin, true); changed = true; }
        });
        if (changed) { write(KEYS.students, list); }
    }

    /* ---------- public API ---------- */

    function init() {
        if (!available()) { return false; }
        ensure(KEYS.parents, []);
        ensure(KEYS.students, []);
        ensure(KEYS.activities, []);
        ensure(KEYS.attempts, []);
        ensure(KEYS.settings, {});
        ensure(KEYS.annotations, {});
        ensure(KEYS.bookmarks, {});
        migrateStudents();
        return true;
    }

    function getParentById(id) {
        var list = readList(KEYS.parents);
        for (var i = 0; i < list.length; i++) {
            if (list[i].parentId === id) { return list[i]; }
        }
        return null;
    }

    function findParentByEmail(email) {
        var wanted = String(email).trim().toLowerCase();
        var list = readList(KEYS.parents);
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].email).toLowerCase() === wanted) { return list[i]; }
        }
        return null;
    }

    function addParent(input) {
        var parents = readList(KEYS.parents);
        var salt = randomHex(8);
        var parent = {
            parentId: nextId('parent', parents, 'parentId'),
            name: input.name,
            email: input.email,
            salt: salt,
            passwordHash: hashPassword(input.password, salt),
            recoveryCode: makeRecoveryCode(),
            createdAt: new Date().toISOString()
        };
        parents.push(parent);
        return write(KEYS.parents, parents) ? parent : null;
    }

    function getStudentById(id) {
        var list = readList(KEYS.students);
        for (var i = 0; i < list.length; i++) {
            if (list[i].studentId === id) { return list[i]; }
        }
        return null;
    }

    /* Only ever returns students that belong to the given parent. */
    function getStudentsByParent(parentId) {
        return readList(KEYS.students).filter(function (s) {
            return s.parentId === parentId;
        });
    }

    function findStudentByUsername(username) {
        var wanted = String(username).trim().toLowerCase();
        var list = readList(KEYS.students);
        for (var i = 0; i < list.length; i++) {
            if (String(list[i].username).toLowerCase() === wanted) { return list[i]; }
        }
        return null;
    }

    function addStudent(input) {
        var students = readList(KEYS.students);
        var student = {
            studentId: nextId('student', students, 'studentId'),
            parentId: input.parentId,
            name: input.name,
            gradeLevel: input.gradeLevel,
            school: input.school || '',
            readingLevel: input.readingLevel || '',
            username: makeUsername(input.name, students),
            createdAt: new Date().toISOString()
        };
        applyPin(student, makePin(), true);
        students.push(student);
        if (!write(KEYS.students, students)) { return null; }

        var settings = readObject(KEYS.settings);
        settings[student.studentId] = {};
        write(KEYS.settings, settings);
        return student;
    }


    /* ---------- Part 2: settings, activities, attempts, annotations ---------- */

    function clone(value) { return JSON.parse(JSON.stringify(value)); }

    /* Per-student settings. Always returns a fresh object. */
    function getSettings(studentId) {
        var all = readObject(KEYS.settings);
        var mine = all[studentId];
        return mine && typeof mine === 'object' ? clone(mine) : {};
    }

    function saveSettings(studentId, partial) {
        var all = readObject(KEYS.settings);
        var mine = all[studentId] && typeof all[studentId] === 'object' ? all[studentId] : {};
        Object.keys(partial).forEach(function (k) { mine[k] = partial[k]; });
        all[studentId] = mine;
        return write(KEYS.settings, all) ? clone(mine) : null;
    }

    function resetSettings(studentId) {
        var all = readObject(KEYS.settings);
        var keep = all[studentId] && all[studentId].difficulty ? { difficulty: all[studentId].difficulty } : {};
        all[studentId] = keep;
        return write(KEYS.settings, all);
    }

    /* Activities: one record per student + story. */
    function getActivities(studentId) {
        return readList(KEYS.activities).filter(function (a) { return a.studentId === studentId; });
    }

    function upsertActivity(studentId, story, patch) {
        var list = readList(KEYS.activities);
        var found = null;
        list.forEach(function (a) {
            if (a.studentId === studentId && a.storyId === story.storyId) { found = a; }
        });
        var now = new Date().toISOString();
        if (!found) {
            found = {
                activityId: nextId('activity', list, 'activityId'),
                studentId: studentId,
                storyId: story.storyId,
                title: story.title,
                difficulty: story.level,
                status: 'in_progress',
                attemptCount: 0,
                startedAt: now,
                lastAttemptAt: now,
                completedAt: null
            };
            list.push(found);
        }
        Object.keys(patch || {}).forEach(function (k) { found[k] = patch[k]; });
        return write(KEYS.activities, list) ? found : null;
    }

    /* Attempts. Every read is filtered by student, so one student can
       never load another student's attempt. */
    function getAttemptsByStudent(studentId) {
        return readList(KEYS.attempts).filter(function (a) { return a.studentId === studentId; });
    }

    function getAttempt(attemptId, studentId) {
        var list = readList(KEYS.attempts);
        for (var i = 0; i < list.length; i++) {
            if (list[i].attemptId === attemptId && list[i].studentId === studentId) { return list[i]; }
        }
        return null;
    }

    function addAttempt(attempt) {
        var list = readList(KEYS.attempts);
        attempt.attemptId = nextId('attempt', list, 'attemptId');
        list.push(attempt);
        return write(KEYS.attempts, list) ? attempt : null;
    }

    /* Replace one attempt by id (only if it belongs to that student). */
    function saveAttempt(attempt) {
        var list = readList(KEYS.attempts);
        for (var i = 0; i < list.length; i++) {
            if (list[i].attemptId === attempt.attemptId && list[i].studentId === attempt.studentId) {
                list[i] = attempt;
                return write(KEYS.attempts, list);
            }
        }
        return false;
    }

    function getAnnotations(studentId, storyId) {
        var all = readObject(KEYS.annotations);
        var mine = all[studentId] && all[studentId][storyId];
        if (!mine) { return { highlights: [], storyNote: '' }; }
        return clone({
            highlights: Array.isArray(mine.highlights) ? mine.highlights : [],
            storyNote: typeof mine.storyNote === 'string' ? mine.storyNote : ''
        });
    }

    function saveAnnotations(studentId, storyId, data) {
        var all = readObject(KEYS.annotations);
        if (!all[studentId] || typeof all[studentId] !== 'object') { all[studentId] = {}; }
        all[studentId][storyId] = { highlights: data.highlights, storyNote: data.storyNote || '' };
        return write(KEYS.annotations, all);
    }

    /* ---------- Part 3: accounts, PINs, bookmarks ---------- */

    function checkPin(student, pin) {
        return !!student && !!student.pinHash &&
            student.pinHash === hashPassword(String(pin), student.pinSalt);
    }

    function checkParentPassword(parentId, password) {
        var p = getParentById(parentId);
        return !!p && p.passwordHash === hashPassword(String(password), p.salt);
    }

    function updateParent(parentId, mutate) {
        var list = readList(KEYS.parents);
        for (var i = 0; i < list.length; i++) {
            if (list[i].parentId === parentId) {
                mutate(list[i]);
                return write(KEYS.parents, list) ? list[i] : null;
            }
        }
        return null;
    }

    function updateParentEmail(parentId, email) {
        return updateParent(parentId, function (p) { p.email = email; });
    }

    function updateParentPassword(parentId, password) {
        return updateParent(parentId, function (p) {
            p.salt = randomHex(8);
            p.passwordHash = hashPassword(password, p.salt);
        });
    }

    function updateStudent(studentId, parentId, mutate) {
        var list = readList(KEYS.students);
        for (var i = 0; i < list.length; i++) {
            if (list[i].studentId === studentId && list[i].parentId === parentId) {
                mutate(list[i]);
                return write(KEYS.students, list) ? list[i] : null;
            }
        }
        return null;
    }

    /* pin === null  -> the system generates a new PIN (parent may view it).
       pin === '1234' -> the parent's own PIN (stored as a hash only). */
    function setStudentPin(studentId, parentId, pin) {
        var generated = pin === null || pin === undefined;
        var value = generated ? makePin() : String(pin);
        return updateStudent(studentId, parentId, function (s) { applyPin(s, value, generated); });
    }

    function setStudentUsername(studentId, parentId, username) {
        return updateStudent(studentId, parentId, function (s) { s.username = username; });
    }

    function getBookmarks(studentId) {
        var all = readObject(KEYS.bookmarks);
        return Array.isArray(all[studentId]) ? all[studentId].slice() : [];
    }

    /* Adds or removes a bookmark. Returns true when the story is now bookmarked. */
    function toggleBookmark(studentId, storyId) {
        var all = readObject(KEYS.bookmarks);
        var mine = Array.isArray(all[studentId]) ? all[studentId] : [];
        var at = mine.indexOf(storyId);
        if (at >= 0) { mine.splice(at, 1); } else { mine.push(storyId); }
        all[studentId] = mine;
        write(KEYS.bookmarks, all);
        return mine.indexOf(storyId) >= 0;
    }

    /* Builds a link that works from any folder (pages set data-root="../"). */
    function url(path) {
        var root = global.document && global.document.body
            ? global.document.body.getAttribute('data-root') || '' : '';
        return root + path;
    }
    RW.url = url;


    /* ---------- AI study tips opt-in (set by the parent, per child) ---------- */

    function getAiTips(studentId) {
        return readObject(KEYS.aiTips)[studentId] === true;
    }

    function setAiTips(studentId, parentId, on) {
        var student = getStudentById(studentId);
        if (!student || student.parentId !== parentId) { return false; }
        var all = readObject(KEYS.aiTips);
        all[studentId] = !!on;
        return write(KEYS.aiTips, all);
    }

    RW.store = {
        getAiTips: getAiTips,
        setAiTips: setAiTips,
        KEYS: KEYS,
        available: available,
        init: init,
        hashPassword: hashPassword,
        getParentById: getParentById,
        findParentByEmail: findParentByEmail,
        addParent: addParent,
        ensureRecoveryCode: ensureRecoveryCode,
        resetPassword: resetPassword,
        getStudentById: getStudentById,
        getStudentsByParent: getStudentsByParent,
        findStudentByUsername: findStudentByUsername,
        addStudent: addStudent,
        getSettings: getSettings,
        saveSettings: saveSettings,
        resetSettings: resetSettings,
        getActivities: getActivities,
        upsertActivity: upsertActivity,
        getAttemptsByStudent: getAttemptsByStudent,
        getAttempt: getAttempt,
        addAttempt: addAttempt,
        saveAttempt: saveAttempt,
        getAnnotations: getAnnotations,
        saveAnnotations: saveAnnotations,
        checkPin: checkPin,
        checkParentPassword: checkParentPassword,
        updateParentEmail: updateParentEmail,
        updateParentPassword: updateParentPassword,
        setStudentPin: setStudentPin,
        setStudentUsername: setStudentUsername,
        getBookmarks: getBookmarks,
        toggleBookmark: toggleBookmark
    };

    init();
})(window);
