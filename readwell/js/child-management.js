/* ReadWell — parent/child-management.html
   Lists this parent's children. PINs are NOT shown here: logins are
   managed on the Settings page. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;

    var parent = RW.auth.requireParent();
    if (!parent) { return; }

    var box = byId('profiles');
    var children = RW.store.getStudentsByParent(parent.parentId);

    if (!children.length) {
        box.appendChild(el('div', { class: 'card empty-card' }, [
            el('h2', { text: 'No children yet' }),
            el('p', { text: 'Add a child profile to create their student username and PIN.' })
        ]));
        return;
    }

    children.forEach(function (child) {
        var dl = el('dl', { class: 'details' });
        function row(term, value) {
            dl.appendChild(el('dt', { text: term }));
            dl.appendChild(el('dd', {}, [value]));
        }
        row('Grade level', child.gradeLevel);
        row('School', child.school || 'Not added');
        row('Reading level', child.readingLevel || 'Not added');
        row('Student username', el('span', { class: 'mono', text: child.username }));

        var view = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' }, ['View activity', el('span', { class: 'visually-hidden', text: ' for ' + child.name })]);
        view.addEventListener('click', function () {
            RW.auth.setSelectedChildId(child.studentId);
            window.location.href = 'parent-dashboard.html#activity';
        });

        box.appendChild(el('section', { class: 'card', 'aria-label': child.name }, [
            el('h2', { text: child.name }),
            dl,
            el('div', { class: 'button-row' }, [view])
        ]));
    });
})();
