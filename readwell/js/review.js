/* ReadWell — review.html: every question, your answer, the right answer and why */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content, engine = RW.questions, store = RW.store;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    RW.settings.init(student.studentId);

    var attemptId = new URLSearchParams(window.location.search).get('attempt');
    var attempt = attemptId ? store.getAttempt(attemptId, student.studentId) : null;
    var story = attempt ? content.getStory(attempt.storyId) : null;

    if (!attempt || !story || attempt.status !== 'completed') {
        byId('notice-view').hidden = false;
        if (attempt && story) {
            byId('notice-text').textContent = 'Finish the story first, then you can review your answers.';
        }
        document.title = 'Review not found | ReadWell';
        return;
    }

    // Remember that the student opened the review (used by the "Review Ready" achievement).
    if (!attempt.reviewedAt) {
        attempt.reviewedAt = new Date().toISOString();
        store.saveAttempt(attempt);
    }

    byId('review-view').hidden = false;
    var sum = engine.summarize(attempt, story);
    document.title = 'Review: ' + story.title + ' | ReadWell';
    byId('review-title').textContent = 'Review: ' + story.title;
    byId('review-sub').textContent = (attempt.mode === 'practice' ? 'Practice attempt' : 'Original attempt') +
        ' · ' + sum.correct + ' of ' + sum.total + ' correct on the first try';

    var resultsUrl = 'results.html?attempt=' + encodeURIComponent(attempt.attemptId);
    byId('back-results').setAttribute('href', resultsUrl);
    byId('results-link').setAttribute('href', resultsUrl);
    byId('retry-link').setAttribute('href', 'reading.html?story=' + encodeURIComponent(story.storyId));

    var list = byId('review-list');
    var filter = 'all';

    function row(term, value) {
        return [el('dt', { text: term }), el('dd', { text: value })];
    }

    function buildItem(q, number) {
        var a = engine.findAnswer(attempt, q.questionId);
        var answered = !!(a && a.submitted);
        var correct = answered && a.firstCorrect;
        var panelId = 'explain-' + number;

        var statusEl = el('span', {
            class: 'status ' + (!answered ? 'status-skipped' : correct ? 'status-correct' : 'status-wrong'),
            text: !answered ? 'Not answered' : correct ? '✓ Correct' : '✕ Incorrect'
        });

        var details = el('dl', { class: 'details' });
        var yourAnswer = answered ? a.firstAnswer : 'No answer';
        var rows = [].concat(
            row('Your answer', yourAnswer),
            row('Correct answer', q.correctAnswer),
            row('Result', !answered ? 'Not answered' : correct ? 'Correct' : 'Incorrect'),
            row('Skill', q.skill + ' (' + q.category + ')'),
            row('Hints used', String(a ? a.hintsUsed : 0))
        );
        if (answered && !correct && a.solved) {
            rows = rows.concat(row('Later', 'You found the right answer on try ' + a.tries + '.'));
        }
        rows.forEach(function (n) { details.appendChild(n); });

        var panel = el('div', { class: 'explain', id: panelId, hidden: '' }, [
            el('p', {}, [el('strong', { text: 'Explanation: ' }), q.explanation]),
            el('p', {}, [el('strong', { text: 'Evidence from the story:' })]),
            el('blockquote', { class: 'quote', text: content.evidenceParts(q.evidence).join(' … ') })
        ]);

        var toggle = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'aria-expanded': 'false', 'aria-controls': panelId, text: 'Show Explanation' });
        toggle.addEventListener('click', function () {
            var open = panel.hidden;
            panel.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.textContent = open ? 'Hide Explanation' : 'Show Explanation';
        });

        var item = el('li', { class: 'reading-surface review-item', 'data-correct': correct ? 'yes' : 'no', 'data-number': String(number) }, [
            el('div', { class: 'review-head' }, [el('h3', { text: 'Question ' + number }), statusEl]),
            el('p', { class: 'review-q', text: q.questionText }),
            details,
            toggle,
            panel
        ]);
        return item;
    }

    var items = story.questions.map(function (q, i) { return buildItem(q, i + 1); });

    function render() {
        ui.clear(list);
        var shown = 0;
        items.forEach(function (item) {
            var keep = filter === 'all' || item.getAttribute('data-correct') === 'no';
            if (keep) { list.appendChild(item); shown += 1; }
        });
        byId('filter-note').textContent = filter === 'all'
            ? 'Showing all ' + items.length + ' questions.'
            : (shown ? 'Showing ' + shown + ' incorrect ' + (shown === 1 ? 'question.' : 'questions.') : 'You answered every question correctly on the first try. Nothing to show here.');
    }

    var buttons = byId('filter-buttons').querySelectorAll('button');
    Array.prototype.forEach.call(buttons, function (b) {
        b.addEventListener('click', function () {
            filter = b.getAttribute('data-filter');
            Array.prototype.forEach.call(buttons, function (x) {
                x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
            });
            render();
        });
    });

    render();
})();
