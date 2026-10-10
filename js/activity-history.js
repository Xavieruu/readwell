/* ReadWell — student/activity-history.html
   Lists every finished attempt for this student, newest first.
   Original and practice attempts are labelled with text (not colour alone).
   Nothing on this page deletes or changes an attempt. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    RW.settings.init(id);

    var all = RW.progress.completedAttempts(id);   // oldest first
    if (!all.length) { byId('empty').hidden = false; return; }
    byId('list-card').hidden = false;

    function byIdMap() {
        var map = {};
        all.forEach(function (a) { map[a.attemptId] = a; });
        return map;
    }
    var lookup = byIdMap();

    function item(a) {
        var story = content.getStory(a.storyId);
        var isPractice = a.mode === 'practice';
        var when = RW.progress.formatDate(a.completedAt);

        var parts = [
            el('h3', { text: story.title }),
            el('p', {}, [
                el('span', { class: 'badge', text: isPractice ? 'Practice Attempt' : 'Original Attempt' })
            ]),
            el('p', { class: 'story-meta', text: content.levelLabel(a.difficulty) + ' · ' + a.summary.total + ' questions · ' + when }),
            el('p', {}, [el('span', { class: 'badge badge-outline', text: 'Score: ' + a.summary.percent + '% (' + a.summary.correct + ' of ' + a.summary.total + ' correct)' })])
        ];

        if (isPractice && lookup[a.baseAttemptId]) {
            var base = lookup[a.baseAttemptId];
            var diff = a.summary.percent - base.summary.percent;
            var sign = diff > 0 ? '+' : '';
            parts.push(el('p', { class: 'story-meta',
                text: 'Original: ' + base.summary.percent + '% · Practice: ' + a.summary.percent + '% · Change: ' + sign + diff + '%' }));
        }

        parts.push(el('div', { class: 'button-row' }, [
            el('a', { class: 'btn btn-primary btn-sm', href: 'results.html?attempt=' + encodeURIComponent(a.attemptId), text: 'Results' }),
            el('a', { class: 'btn btn-secondary btn-sm', href: 'review.html?attempt=' + encodeURIComponent(a.attemptId), text: 'Review answers' })
        ]));

        return el('li', {}, [el('article', { class: 'story-card' }, parts)]);
    }

    function render() {
        var mode = byId('filter').value;
        var list = byId('history-list');
        ui.clear(list);
        var shown = all.slice().reverse().filter(function (a) { return mode === 'all' || a.mode === mode; });
        if (!shown.length) {
            list.appendChild(el('li', { text: 'No attempts match this filter yet.' }));
            return;
        }
        shown.forEach(function (a) { list.appendChild(item(a)); });
    }

    byId('filter').addEventListener('change', render);
    render();
})();
