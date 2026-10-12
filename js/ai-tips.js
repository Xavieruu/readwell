/* =========================================================
   ReadWell — optional AI study tips (student Progress page)
   Shown only when the parent turned tips on for this child.
   Sends ONLY skill names, percentages and a level to /api/suggest.
   The rule-based advice on the page is always there as well; this
   is an extra. Tips are inserted with textContent only.
   ========================================================= */
(function () {
    'use strict';

    var RW = window.RW;
    var byId = RW.ui.byId, el = RW.ui.el;

    var student = RW.auth.getSession();
    var card = byId('ai-tips');
    if (!card || !student || student.role !== 'student') { return; }
    var id = student.student.studentId;
    if (!RW.store.getAiTips(id)) { return; }

    var st = RW.progress.stats(id);
    if (!st.hasData) { return; }
    card.hidden = false;

    var button = byId('ai-tips-button');
    var status = byId('ai-tips-status');
    var list = byId('ai-tips-list');

    /* Remember tips for this many attempts so we do not ask again and again. */
    var cacheKey = 'rw_ai_tips_cache_' + id + '_' + st.attemptsCompleted;

    function show(tips) {
        RW.ui.clear(list);
        tips.forEach(function (t) { list.appendChild(el('li', { text: t })); });
        list.hidden = false;
    }

    try {
        var saved = window.sessionStorage.getItem(cacheKey);
        if (saved) { show(JSON.parse(saved)); button.textContent = 'Get new tips'; }
    } catch (e) { /* no cache, that is fine */ }

    function level() {
        var attempts = RW.progress.completedAttempts(id);
        var last = attempts[attempts.length - 1];
        return RW.content.levelLabel(last.difficulty || last.level || 'beginner');
    }

    button.addEventListener('click', function () {
        if (window.location.protocol === 'file:') {
            status.textContent = 'Study tips only work on the published site, not when the file is opened from a folder.';
            return;
        }
        var skills = st.skills.filter(function (s) { return s.total >= 1; }).map(function (s) {
            return { skill: s.skill, percent: s.percent, total: s.total };
        });
        button.disabled = true;
        status.textContent = 'Getting your tips…';

        window.fetch(RW.url('api/suggest'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ average: st.average, level: level(), skills: skills })
        }).then(function (r) {
            return r.json().then(function (body) { return { ok: r.ok, body: body }; });
        }).then(function (res) {
            if (!res.ok) { throw new Error(res.body && res.body.error); }
            show(res.body.tips);
            status.textContent = '';
            button.textContent = 'Get new tips';
            try { window.sessionStorage.setItem(cacheKey, JSON.stringify(res.body.tips)); } catch (e) { /* ignore */ }
        }).catch(function (err) {
            status.textContent = (err && err.message) || 'Tips are not available right now. Your other advice on this page still works.';
        }).then(function () { button.disabled = false; });
    });
})();
