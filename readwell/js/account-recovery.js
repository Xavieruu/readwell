/* ReadWell — account recovery page
   ?type=student  -> tells a student to ask their parent
   otherwise      -> parent resets their password with email + recovery code */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    var isStudent = new URLSearchParams(window.location.search).get('type') === 'student';

    ui.byId('recovery-parent').hidden = isStudent;
    ui.byId('recovery-student').hidden = !isStudent;
    window.document.title = (isStudent ? 'Forgot your account code?' : 'Account recovery') + ' | ReadWell';

    if (isStudent) { return; }

    var form = ui.byId('recovery-form');
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    ui.bindShowToggle('show-password', ['recovery-password', 'recovery-confirm']);

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var email = ui.byId('recovery-email').value.trim();
        var code = ui.byId('recovery-code').value.trim();
        var password = ui.byId('recovery-password').value;
        var confirm = ui.byId('recovery-confirm').value;
        var valid = true;

        if (!email) {
            ui.setFieldError('recovery-email', 'Enter your email address.');
            valid = false;
        } else if (!EMAIL_PATTERN.test(email)) {
            ui.setFieldError('recovery-email', 'Enter a valid email, like name@example.com.');
            valid = false;
        }

        if (!code) {
            ui.setFieldError('recovery-code', 'Enter your recovery code.');
            valid = false;
        }

        if (password.length < 8) {
            ui.setFieldError('recovery-password', 'Your new password needs at least 8 characters.');
            valid = false;
        }

        if (!confirm) {
            ui.setFieldError('recovery-confirm', 'Type your new password again to confirm it.');
            valid = false;
        } else if (password && confirm !== password) {
            ui.setFieldError('recovery-confirm', 'The two passwords do not match.');
            valid = false;
        }

        if (!valid) {
            ui.focusFirstInvalid(form);
            return;
        }

        var result = RW.auth.resetPassword(email, code, password);
        if (!result.ok) {
            ui.showAlert(result.error);
            return;
        }

        ui.byId('recovery-parent').hidden = true;
        ui.byId('recovery-done').hidden = false;
        window.document.title = 'Password updated | ReadWell';
        ui.byId('recovery-done-title').focus();
    });
})();
