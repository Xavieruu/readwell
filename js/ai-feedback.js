/* =========================================================
   ReadWell — optional AI "coach note" for each answer
   Only runs when the parent turned on AI tips for this child.
   The browser sends just: the question id, the answer the student
   picked and the try number. Nothing personal is sent.
   The note is extra: the normal feedback always shows first, the
   score is never changed, and any error simply hides the note.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW;
    var byId = RW.ui.byId;
    var latest = 0;   // numbers each request so an old reply is ignored

    function enabled() {
        var session = RW.auth.getSession();
        return !!(session && session.role === 'student' &&
            RW.store.getAiTips(session.student.studentId) &&
            global.location.protocol !== 'file:');
    }

    function hide() {
        latest += 1;
        var box = byId('ai-feedback');
        if (box) { box.hidden = true; }
    }

    /* Ask for a coach note about the answer that was just submitted. */
    function ask(question, answer, tries) {
        var box = byId('ai-feedback');
        if (!box || !enabled()) { return; }

        var body = byId('ai-feedback-body');
        var mine = ++latest;
        var cacheKey = 'rw_ai_fb_' + question.questionId + '_' + tries + '_' + answer;

        function put(text) {
            if (mine !== latest) { return; }   // the student already moved on
            body.textContent = text;
            box.hidden = false;
        }

        try {
            var saved = global.sessionStorage.getItem(cacheKey);
            if (saved) { put(saved); return; }
        } catch (e) { /* no cache, fine */ }

        put('Your coach is thinking…');

        global.fetch(RW.url('api/feedback'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId: question.questionId, answer: answer, tries: tries })
        }).then(function (r) {
            if (!r.ok) { throw new Error('not ok'); }
            return r.json();
        }).then(function (res) {
            if (!res || typeof res.feedback !== 'string') { throw new Error('bad reply'); }
            put(res.feedback);
            try { global.sessionStorage.setItem(cacheKey, res.feedback); } catch (e) { /* ignore */ }
        }).catch(function () {
            if (mine === latest) { box.hidden = true; }   // fail quietly
        });
    }

    RW.aiFeedback = { ask: ask, hide: hide, enabled: enabled };
})(window);
