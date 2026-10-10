/* ReadWell — parent registration page */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    if (RW.auth.redirectIfSignedIn('parent')) { return; }

    var form = ui.byId('register-form');
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    ui.bindShowToggle('show-password', ['parent-password', 'parent-confirm']);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var name = ui.byId('parent-name').value.trim();
        var email = ui.byId('parent-email').value.trim();
        var password = ui.byId('parent-password').value;
        var confirm = ui.byId('parent-confirm').value;
        var valid = true;

        if (name.length < 2) {
            ui.setFieldError('parent-name', 'Enter your name (at least 2 characters).');
            valid = false;
        } else if (name.length > 60) {
            ui.setFieldError('parent-name', 'Please use 60 characters or fewer.');
            valid = false;
        }

        if (!email) {
            ui.setFieldError('parent-email', 'Enter your email address.');
            valid = false;
        } else if (!EMAIL_PATTERN.test(email)) {
            ui.setFieldError('parent-email', 'Enter a valid email, like name@example.com.');
            valid = false;
        }

        if (password.length < 8) {
            ui.setFieldError('parent-password', 'Your password needs at least 8 characters.');
            valid = false;
        }

        if (!confirm) {
            ui.setFieldError('parent-confirm', 'Type your password again to confirm it.');
            valid = false;
        } else if (password && confirm !== password) {
            ui.setFieldError('parent-confirm', 'The two passwords do not match.');
            valid = false;
        }

        if (!valid) {
            ui.focusFirstInvalid(form);
            return;
        }

        var result = RW.auth.registerParent({ name: name, email: email, password: password });

        if (!result.ok) {
            if (result.field === 'email') {
                ui.setFieldError('parent-email', result.error);
                ui.focusFirstInvalid(form);
            } else {
                ui.showAlert(result.error);
            }
            return;
        }

        window.location.href = 'add-child.html?first=1';
    });
})();
