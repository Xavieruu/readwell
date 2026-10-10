/* ReadWell — parent login page */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    if (RW.auth.redirectIfSignedIn('parent')) { return; }

    var form = ui.byId('login-form');

    ui.bindShowToggle('show-password', ['login-password']);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var email = ui.byId('login-email').value.trim();
        var password = ui.byId('login-password').value;
        var valid = true;

        if (!email) {
            ui.setFieldError('login-email', 'Enter your email address.');
            valid = false;
        }
        if (!password) {
            ui.setFieldError('login-password', 'Enter your password.');
            valid = false;
        }
        if (!valid) {
            ui.focusFirstInvalid(form);
            return;
        }

        var result = RW.auth.loginParent(email, password);
        if (!result.ok) {
            ui.showAlert(result.error);
            return;
        }

        window.location.href = 'parent-dashboard.html#dashboard';
    });
})();
