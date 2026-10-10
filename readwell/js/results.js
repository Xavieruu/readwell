/* ReadWell — results.html: score, hints, skills and original-vs-practice */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content, engine = RW.questions, store = RW.store;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    RW.settings.init(student.studentId);

    function notice(title, text, linkText, linkHref) {
        byId('results-view').hidden = true;
        byId('notice-view').hidden = false;
        byId('notice-title').textContent = title;
        byId('notice-text').textContent = text;
        var link = byId('notice-link');
        link.textContent = linkText || 'Go to Reading Activities';
        link.setAttribute('href', linkHref || 'reading.html');
        document.title = title + ' | ReadWell';
    }

    var attemptId = new URLSearchParams(window.location.search).get('attempt');
    // Only this student's attempts can be loaded.
    var attempt = attemptId ? store.getAttempt(attemptId, student.studentId) : null;
    var story = attempt ? content.getStory(attempt.storyId) : null;

    if (!attempt || !story) {
        notice('Results not found', 'We could not find those results.');
        return;
    }
    if (attempt.status !== 'completed') {
        notice('Not finished yet', 'You have not finished this story. Keep going to see your results.', 'Continue reading', 'reading.html?story=' + encodeURIComponent(story.storyId));
        return;
    }

    var sum = engine.summarize(attempt, story);
    var modeLabel = attempt.mode === 'practice' ? 'Practice attempt' : 'Original attempt';
    var storyUrl = 'reading.html?story=' + encodeURIComponent(story.storyId);

    byId('results-view').hidden = false;
    document.title = 'Results: ' + story.title + ' | ReadWell';
    byId('results-title').textContent = 'Results: ' + story.title;
    byId('results-sub').textContent = modeLabel + ' · ' + content.levelLabel(story.level);

    byId('score-number').textContent = sum.percent + '%';
    byId('score-text').textContent = sum.correct + ' of ' + sum.total + ' questions correct';
    byId('score-fill').style.width = sum.percent + '%';
    byId('score-meter').setAttribute('aria-label', 'Score: ' + sum.percent + ' percent');
    byId('stat-total').textContent = String(sum.total);
    byId('stat-correct').textContent = String(sum.correct);
    byId('stat-incorrect').textContent = String(sum.incorrect);
    byId('stat-hints').textContent = String(sum.hintsUsed);

    /* skills */
    var list = byId('skill-list');
    sum.skills.forEach(function (s) {
        var pct = engine.percent(s.correct, s.total);
        var label = s.correct + ' of ' + s.total + ' correct';
        list.appendChild(el('li', {}, [
            el('div', { class: 'skill-head' }, [
                el('span', { class: 'skill-name' }, [s.skill, el('span', { class: 'skill-cat', text: ' (' + s.categories.join(', ') + ')' })]),
                el('span', { text: label })
            ]),
            (function () {
                var m = el('div', { class: 'meter', role: 'img', 'aria-label': s.skill + ': ' + label });
                var f = el('div', { class: 'meter-fill' });
                f.style.width = pct + '%';
                m.appendChild(f);
                return m;
            })()
        ]));
    });

    /* original vs practice */
    var original = attempt.mode === 'practice' ? store.getAttempt(attempt.baseAttemptId, student.studentId) : attempt;
    var practices = [];
    if (original && original.status === 'completed') {
        practices = store.getAttemptsByStudent(student.studentId).filter(function (a) {
            return a.mode === 'practice' && a.baseAttemptId === original.attemptId && a.status === 'completed';
        });
    }
    if (original && original.summary && practices.length) {
        var rows = byId('compare-rows');
        function addRow(label, a) {
            var pct = a.summary.percent;
            var here = a.attemptId === attempt.attemptId ? ' (this attempt)' : '';
            var m = el('div', { class: 'meter', role: 'img', 'aria-label': label + ': ' + pct + ' percent' });
            var f = el('div', { class: 'meter-fill' });
            f.style.width = pct + '%';
            m.appendChild(f);
            rows.appendChild(el('div', { class: 'compare-row' }, [
                el('div', { class: 'skill-head' }, [el('span', { class: 'skill-name', text: label + here }), el('span', { text: pct + '%' })]),
                m
            ]));
        }
        addRow('Original attempt', original);
        practices.forEach(function (p, i) { addRow('Practice attempt ' + (i + 1), p); });
        var latest = attempt.mode === 'practice' ? attempt : practices[practices.length - 1];
        var cmp = engine.compare(original, latest);
        var sign = cmp.difference > 0 ? '+' : '';
        byId('compare-text').textContent = 'Original: ' + cmp.original + '% · Practice: ' + cmp.practice +
            '% · Change: ' + sign + cmp.difference + '%. ' + cmp.text;
        byId('compare-card').hidden = false;
    }

    /* Recommendation (rules in recommendations.js) */
    var rec = RW.recommendations.afterAttempt(student.studentId, attempt);
    if (rec) {
        byId('rec-text').textContent = rec.text;
        byId('rec-skill').textContent = 'Recommended activity: ' + rec.story.title + ' — ' + content.levelLabel(rec.story.level);
        byId('rec-link').setAttribute('href', 'reading.html?story=' + encodeURIComponent(rec.story.storyId));
        byId('rec-card').hidden = false;
    }

    byId('review-link').setAttribute('href', 'review.html?attempt=' + encodeURIComponent(attempt.attemptId));
    byId('retry-link').setAttribute('href', storyUrl);
    byId('more-link').setAttribute('href', 'reading.html?level=' + encodeURIComponent(story.level));
})();
