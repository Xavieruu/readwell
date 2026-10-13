/* ReadWell — account recovery page
   ?type=student  -> tells a student to ask their parent
   otherwise      -> the parent gets a password-reset link by email (Firebase). */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui;

    var isStudent = new URLSearchParams(window.location.search).get('type') === 'student';

    ui.byId('recovery-parent').hidden = isStudent;
    ui.byId('recovery-student').hidden = !isStudent;
    window.document.title = (isStudent ? 'Forgot your account code?' : 'Reset your password') + ' | ReadWell';

    if (isStudent) { return; }

    var form = ui.byId('recovery-form');
    var button = ui.byId('recovery-submit');
    var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(form);

        var email = ui.byId('recovery-email').value.trim();
        if (!email) {
            ui.setFieldError('recovery-email', 'Enter your email address.');
        } else if (!EMAIL_PATTERN.test(email)) {
            ui.setFieldError('recovery-email', 'Enter a valid email, like name@example.com.');
        }
        if (form.querySelector('[aria-invalid="true"]')) { ui.focusFirstInvalid(form); return; }

        button.disabled = true;
        RW.auth.sendPasswordReset(email).then(function (result) {
            button.disabled = false;
            if (!result.ok) { ui.showAlert(result.error); return; }
            ui.byId('recovery-sent-to').textContent = email;
            ui.byId('recovery-parent').hidden = true;
            ui.byId('recovery-done').hidden = false;
            window.document.title = 'Check your email | ReadWell';
            ui.byId('recovery-done-title').focus();
        });
    });
})();
