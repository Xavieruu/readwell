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

        setBusy(true);
        RW.auth.loginParentFirebase(email, password).then(function (result) {
            if (!result.ok) {
                setBusy(false);
                ui.showAlert(result.error);
                return;
            }
            window.location.href = 'parent-dashboard.html#dashboard';
        });
    });

    var googleButton = ui.byId('google-button');
    var submitButton = form.querySelector('button[type="submit"]');

    function setBusy(busy) {
        googleButton.disabled = busy;
        submitButton.disabled = busy;
    }

    googleButton.addEventListener('click', function () {
        ui.clearErrors(form);
        setBusy(true);
        RW.auth.loginParentGoogle().then(function (result) {
            if (!result.ok) {
                setBusy(false);
                if (!result.cancelled) { ui.showAlert(result.error); }
                return;
            }
            // A brand-new Google account has no children yet, so start there.
            window.location.href = result.isNew ? 'add-child.html?first=1' : 'parent-dashboard.html#dashboard';
        });
    });
})();
