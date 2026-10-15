/* ReadWell — parent/parent-dashboard.html
   Parent view of ONE child at a time. The "Viewing" selector chooses the
   child, and every number on the page is calculated from that child's own
   attempts (RW.progress only reads the student id it is given).
   Wording stays neutral and encouraging: no labels, no diagnoses. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var auth = RW.auth, store = RW.store, content = RW.content;

    var parent = auth.requireParent();
    if (!parent) { return; }

    /* Only this parent's children are ever loaded. */
    var children = store.getStudentsByParent(parent.parentId);

    byId('dashboard-title').textContent = 'Welcome, ' + parent.name;

    if (!children.length) {
        byId('no-children').hidden = false;
        Array.prototype.forEach.call(document.querySelectorAll('[data-section]'), function (s) { s.hidden = true; });
        return;
    }

    /* ---------- helpers ---------- */

    function stat(number, label) {
        return el('li', { class: 'stat' }, [
            el('span', { class: 'stat-number', text: number }),
            el('span', { class: 'stat-label', text: label })
        ]);
    }

    function meter(label, pct) {
        var m = el('div', { class: 'meter', role: 'img', 'aria-label': label + ': ' + pct + ' percent' });
        var f = el('div', { class: 'meter-fill' });
        f.style.width = pct + '%';
        m.appendChild(f);
        return m;
    }

    function joinNames(list) {
        return list.map(function (s) { return s.skill; }).join(', ');
    }

    /* ---------- the child chooser ---------- */

    var select = byId('child-select');
    children.forEach(function (c) {
        select.appendChild(el('option', { value: c.studentId, text: c.name }));
    });
    byId('chooser-bar').hidden = false;

    function selectedChild() {
        var id = auth.getSelectedChildId(parent.parentId);
        for (var i = 0; i < children.length; i++) {
            if (children[i].studentId === id) { return children[i]; }
        }
        return children[0];
    }

    /* ---------- the three sections ---------- */

    function renderDashboard(child, st) {
        byId('dashboard-sub').textContent = 'A summary of ' + child.name + "'s reading.";
        /* Show the sentence with the child's name in bold green so it stands out. */
        var sentence = RW.progress.summarySentence(child.name, child.studentId);
        var sumBox = byId('sum-sentence');
        ui.clear(sumBox);
        var at = sentence.indexOf(child.name);
        if (at < 0) { sumBox.textContent = sentence; }
        else {
            sumBox.appendChild(document.createTextNode(sentence.slice(0, at)));
            sumBox.appendChild(el('strong', { class: 'name-chip', text: child.name }));
            sumBox.appendChild(document.createTextNode(sentence.slice(at + child.name.length)));
        }

        var stats = byId('sum-stats');
        ui.clear(stats);
        stats.appendChild(stat(String(st.activitiesCompleted), 'Activities completed'));
        stats.appendChild(stat(st.hasData ? st.average + '%' : '–', 'Average score'));
        stats.appendChild(stat(st.hasData ? st.best + '%' : '–', 'Best score'));
        stats.appendChild(stat(String(st.attemptsCompleted), 'Attempts'));

        var practiced = byId('skills-practiced');
        ui.clear(practiced);
        if (st.skills.length) {
            st.skills.forEach(function (s) { practiced.appendChild(el('li', { class: 'chip', text: s.skill })); });
        } else {
            practiced.appendChild(el('li', { class: 'chip-empty', text: 'No skills practiced yet.' }));
        }

        var extra = byId('skills-extra');
        var extraList = byId('skills-extra-list');
        ui.clear(extraList);
        extra.textContent = st.needsPractice.length
            ? 'More practice could help ' + child.name + ' with:'
            : (st.hasData ? 'No skills stand out right now. Keep reading together!' : 'This will show after a few activities.');
        st.needsPractice.forEach(function (s) { extraList.appendChild(el('li', { class: 'chip chip-focus', text: s.skill })); });

        var rec = RW.recommendations.forSkill(child.studentId);
        byId('rec-card').hidden = !rec;
        if (rec) {
            byId('rec-text').textContent = 'To practice ' + rec.skill + ', ' + child.name +
                ' could try ' + rec.story.title + ' (' + content.levelLabel(rec.story.level) + ').';
        }
    }

    function renderActivity(child, st) {
        byId('activity-sub').textContent = 'Recent reading activity for ' + child.name + '.';
        var done = RW.progress.completedAttempts(child.studentId).slice().reverse().slice(0, 10);
        byId('activity-empty').hidden = done.length > 0;
        byId('activity-card').hidden = done.length === 0;

        var list = byId('recent-list');
        ui.clear(list);
        done.forEach(function (a) {
            var story = content.getStory(a.storyId);
            list.appendChild(el('li', {}, [el('article', { class: 'story-card' }, [
                el('h3', { text: story.title }),
                el('p', {}, [el('span', { class: 'badge', text: a.mode === 'practice' ? 'Practice Attempt' : 'Original Attempt' })]),
                el('p', { class: 'story-meta', text: content.levelLabel(a.difficulty) + ' · ' + RW.progress.formatDate(a.completedAt) }),
                el('p', {}, [el('span', { class: 'badge badge-outline', text: 'Score: ' + a.summary.percent + '% (' + a.summary.correct + ' of ' + a.summary.total + ')' })])
            ])]));
        });

        var imp = st.improvements.slice().reverse().slice(0, 5);
        byId('improve-card').hidden = imp.length === 0;
        var il = byId('improve-list');
        ui.clear(il);
        imp.forEach(function (i) {
            var sign = i.difference > 0 ? '+' : '';
            il.appendChild(el('li', { text: i.title + ': original ' + i.originalPercent + '%, practice ' + i.practicePercent + '% (' + sign + i.difference + '%)' }));
        });
    }

    function renderProgress(child, st) {
        byId('progress-sub').textContent = 'How ' + child.name + ' is doing over time.';
        byId('progress-empty').hidden = st.hasData;
        byId('progress-content').hidden = !st.hasData;
        if (!st.hasData) { return; }

        var stats = byId('pr-stats');
        ui.clear(stats);
        stats.appendChild(stat(String(st.activitiesCompleted), 'Activities completed'));
        stats.appendChild(stat(st.average + '%', 'Average score'));
        stats.appendChild(stat(st.best + '%', 'Best score'));
        stats.appendChild(stat(String(st.attemptsCompleted), 'Attempts'));
        stats.appendChild(stat((st.averageImprovement > 0 ? '+' : '') + st.averageImprovement + '%', 'Average change on practice'));

        var list = byId('pr-skills');
        ui.clear(list);
        st.skills.forEach(function (s) {
            list.appendChild(el('li', {}, [
                el('div', { class: 'skill-head' }, [
                    el('span', { class: 'skill-name', text: s.skill }),
                    el('span', { text: s.percent + '% (' + s.correct + ' of ' + s.total + ')' })
                ]),
                meter(s.skill, s.percent)
            ]));
        });

        var saved = store.getBookmarks(child.studentId)
            .map(function (storyId) { return content.getStory(storyId); })
            .filter(Boolean)
            .map(function (s) { return s.title; });
        byId('pr-saved').textContent = saved.length
            ? child.name + ' saved: ' + saved.join(', ') + '.'
            : child.name + ' has not saved any stories.';
    }

    function renderAll() {
        var child = selectedChild();
        auth.setSelectedChildId(child.studentId);
        select.value = child.studentId;
        byId('chooser-avatar').textContent = child.name.charAt(0).toUpperCase();
        var st = RW.progress.stats(child.studentId);
        renderDashboard(child, st);
        renderActivity(child, st);
        renderProgress(child, st);
    }

    select.addEventListener('change', function () {
        auth.setSelectedChildId(select.value);
        renderAll();
    });

    renderAll();
    ui.initSections('dashboard');
})();
