/* ReadWell — student login page */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    if (RW.auth.redirectIfSignedIn('student')) { return; }

    var form = ui.byId('student-form');

    ui.bindShowToggle('show-pin', ['student-pin']);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var username = ui.byId('student-username').value.trim();
        var pin = ui.byId('student-pin').value.trim();
        var valid = true;

        if (!username) {
            ui.setFieldError('student-username', 'Type your username.');
            valid = false;
        }
        if (!/^\d{4}$/.test(pin)) {
            ui.setFieldError('student-pin', 'Your PIN is 4 numbers, like 1234.');
            valid = false;
        }
        if (!valid) {
            ui.focusFirstInvalid(form);
            return;
        }

        var result = RW.auth.loginStudent(username, pin);
        if (!result.ok) {
            ui.showAlert(result.error);
            return;
        }

        window.location.href = 'student-dashboard.html#home';
    });
})();
