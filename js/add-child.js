/* ReadWell — add child page */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    var parent = RW.auth.requireParent();
    if (!parent) { return; }

    var form = ui.byId('child-form');

    /* "First child" mode only applies while the parent has no children yet. */
    var params = new URLSearchParams(window.location.search);
    var isFirst = params.get('first') === '1' &&
        RW.store.getStudentsByParent(parent.parentId).length === 0;

    if (isFirst) {
        ui.byId('add-child-title').textContent = 'Add Your First Child';
        ui.byId('steps-bar').hidden = false;
        ui.byId('skip-link').textContent = 'Skip for now';
        window.document.title = 'Add your first child | ReadWell';
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var name = ui.byId('child-name').value.trim();
        var grade = ui.byId('child-grade').value;
        var school = ui.byId('child-school').value.trim();
        var reading = ui.byId('child-reading').value;
        var valid = true;

        if (!name) {
            ui.setFieldError('child-name', "Enter your child's name or a preferred name.");
            valid = false;
        } else if (name.length > 40) {
            ui.setFieldError('child-name', 'Please use 40 characters or fewer.');
            valid = false;
        }

        if (!grade) {
            ui.setFieldError('child-grade', 'Choose your child’s grade level.');
            valid = false;
        }

        if (!valid) {
            ui.focusFirstInvalid(form);
            return;
        }

        var student = RW.store.addStudent({
            parentId: parent.parentId,
            name: name,
            gradeLevel: grade,
            school: school,
            readingLevel: reading
        });

        if (!student) {
            ui.showAlert('We could not save this profile. Your browser may be blocking local storage.');
            return;
        }

        RW.auth.setSelectedChildId(student.studentId);

        ui.byId('success-name').textContent = student.name;
        ui.byId('success-grade').textContent = student.gradeLevel;
        ui.byId('new-username').textContent = student.username;
        ui.byId('new-pin').textContent = student.displayPin;

        ui.byId('form-view').hidden = true;
        ui.byId('success-view').hidden = false;
        window.document.title = 'Profile created | ReadWell';
        window.scrollTo(0, 0);
        ui.byId('success-title').focus();
    });

    /* "Copy" buttons next to the username and PIN. */
    Array.prototype.forEach.call(document.querySelectorAll('.copy-btn'), function (btn) {
        btn.addEventListener('click', function () {
            var text = ui.byId(btn.getAttribute('data-copy')).textContent;
            function done() {
                btn.textContent = 'Copied';
                window.setTimeout(function () { btn.textContent = 'Copy'; }, 1500);
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(done, function () {});
            }
        });
    });
})();
