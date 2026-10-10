/* ReadWell — student/progress.html
   Shows this student's progress. All numbers come from RW.progress,
   which only reads the signed-in student's attempts. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    RW.settings.init(id);

    var st = RW.progress.stats(id);
    if (!st.hasData) { byId('empty').hidden = false; return; }
    byId('content').hidden = false;

    byId('s-completed').textContent = String(st.activitiesCompleted);
    byId('s-average').textContent = st.average + '%';
    byId('s-best').textContent = st.best + '%';
    byId('s-attempts').textContent = String(st.attemptsCompleted);

    function meter(label, pct) {
        var m = el('div', { class: 'meter', role: 'img', 'aria-label': label + ': ' + pct + ' percent' });
        var f = el('div', { class: 'meter-fill' });
        f.style.width = pct + '%';
        m.appendChild(f);
        return m;
    }

    /* Good at / practice more */
    function fillSkills(listId, skills, emptyText) {
        var list = byId(listId);
        if (!skills.length) { list.appendChild(el('li', { text: emptyText })); return; }
        skills.forEach(function (s) {
            list.appendChild(el('li', {}, [el('strong', { text: s.skill }), ' — ' + s.percent + '% (' + s.correct + ' of ' + s.total + ' correct)']));
        });
    }
    fillSkills('good-list', st.strengths, 'Keep reading. Your strengths will show up here as you answer more questions.');
    fillSkills('practice-list', st.needsPractice, 'Nothing stands out right now. Nice work! Try a harder story when you are ready.');

    var rec = RW.recommendations.forSkill(id);
    if (rec) {
        byId('skill-rec-text').textContent = 'You may want to practice: ' + rec.skill + '. Recommended activity: ' +
            rec.story.title + ' — ' + content.levelLabel(rec.story.level);
        byId('skill-rec-link').setAttribute('href', 'reading.html?story=' + encodeURIComponent(rec.story.storyId));
        byId('skill-rec').hidden = false;
    }

    /* Accuracy by skill */
    st.skills.forEach(function (s) {
        byId('skill-list').appendChild(el('li', {}, [
            el('div', { class: 'skill-head' }, [
                el('span', { class: 'skill-name', text: s.skill }),
                el('span', { text: s.percent + '% (' + s.correct + ' of ' + s.total + ')' })
            ]),
            meter(s.skill, s.percent)
        ]));
    });

    /* Scores over time: a small SVG line chart plus a text list (the list is
       what screen readers use; the picture is hidden from them). */
    function chart(points) {
        var NS = 'http://www.w3.org/2000/svg';
        var W = 480, H = 220, L = 54, R = 16, T = 16, B = 34;
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svg.setAttribute('class', 'chart');
        svg.setAttribute('aria-hidden', 'true');
        function node(tag, attrs) {
            var n = document.createElementNS(NS, tag);
            Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
            svg.appendChild(n);
            return n;
        }
        [0, 50, 100].forEach(function (v) {
            var y = T + (H - T - B) * (1 - v / 100);
            node('line', { x1: L, x2: W - R, y1: y, y2: y, class: 'chart-grid' });
            var t = node('text', { x: L - 8, y: y + 4, 'text-anchor': 'end', class: 'chart-text' });
            t.textContent = v + '%';
        });
        var n = points.length;
        function xAt(i) { return n === 1 ? (L + W - R) / 2 : L + (W - L - R) * i / (n - 1); }
        function yAt(v) { return T + (H - T - B) * (1 - v / 100); }
        node('polyline', { points: points.map(function (p, i) { return xAt(i) + ',' + yAt(p.percent); }).join(' '), class: 'chart-line', fill: 'none' });
        points.forEach(function (p, i) {
            // Original = circle, practice = square, so the difference is not colour only.
            if (p.mode === 'practice') {
                node('rect', { x: xAt(i) - 5, y: yAt(p.percent) - 5, width: 10, height: 10, class: 'chart-dot' });
            } else {
                node('circle', { cx: xAt(i), cy: yAt(p.percent), r: 6, class: 'chart-dot' });
            }
            var t = node('text', { x: xAt(i), y: H - 8, 'text-anchor': 'middle', class: 'chart-text' });
            t.textContent = String(i + 1);
        });
        return svg;
    }
    var recent = st.timeline.slice(-10);
    var offset = st.timeline.length - recent.length;
    byId('chart').appendChild(chart(recent));
    byId('chart').appendChild(el('p', { class: 'field-hint', text: 'Circle = original attempt, square = practice attempt. Numbers under the chart match the list below.' }));
    recent.forEach(function (p, i) {
        byId('score-list').appendChild(el('li', {
            text: p.title + ' — ' + p.percent + '% (' +
                (p.mode === 'practice' ? 'Practice attempt' : 'Original attempt') + ', ' + RW.progress.formatDate(p.date) + ')'
        }));
    });
    byId('score-list').setAttribute('start', String(offset + 1));

    /* Improvement */
    if (st.improvements.length) {
        var avg = st.averageImprovement;
        byId('improve-text').textContent = 'You tried ' + st.improvements.length + ' practice attempt' +
            (st.improvements.length === 1 ? '' : 's') + '. On average the change from the original was ' +
            (avg > 0 ? '+' : '') + avg + '%.';
        st.improvements.slice().reverse().slice(0, 5).forEach(function (i) {
            byId('improve-list').appendChild(el('li', {
                text: i.title + ' — Original: ' + i.originalPercent + '% · Practice: ' + i.practicePercent +
                    '% · Change: ' + (i.difference > 0 ? '+' : '') + i.difference + '%'
            }));
        });
    } else {
        byId('improve-text').textContent = 'When you practice a story again, you will see how your score changed here.';
    }

    /* Recent activities */
    st.recent.forEach(function (a) {
        var story = content.getStory(a.storyId);
        byId('recent-list').appendChild(el('li', {}, [el('article', { class: 'story-card' }, [
            el('h3', { text: story.title }),
            el('p', { class: 'story-meta', text: (a.mode === 'practice' ? 'Practice Attempt' : 'Original Attempt') + ' · ' + content.levelLabel(story.level) + ' · ' + RW.progress.formatDate(a.completedAt) }),
            el('p', {}, [el('span', { class: 'badge badge-outline', text: a.summary.percent + '% · ' + a.summary.correct + ' of ' + a.summary.total + ' correct' })]),
            el('div', { class: 'button-row' }, [
                el('a', { class: 'btn btn-primary btn-sm', href: 'results.html?attempt=' + encodeURIComponent(a.attemptId), text: 'Results' }),
                el('a', { class: 'btn btn-secondary btn-sm', href: 'review.html?attempt=' + encodeURIComponent(a.attemptId), text: 'Review answers' })
            ])
        ])]));
    });

    /* Achievements: status is written in words, not only shown with colour. */
    RW.achievements.list(id).forEach(function (a) {
        byId('ach-list').appendChild(el('li', { class: a.earned ? 'ach is-earned' : 'ach' }, [
            el('span', { class: 'ach-head' }, [
                el('strong', { text: a.title }),
                el('span', { class: 'badge badge-outline', text: a.earned ? '✓ Earned' : 'Not earned yet' })
            ]),
            el('span', { class: 'ach-desc', text: a.description }),
            a.note === 'Not yet' ? null : el('span', { class: 'ach-note', text: a.note })
        ]));
    });
})();
