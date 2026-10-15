/* ReadWell — parent/parent-settings.html
   1) The parent's own account: change email and password.
   2) Student account management: see a child's username and default PIN,
      change the username, make a new PIN or choose a PIN.

   PROTOTYPE NOTE: the default PIN is kept in this browser only so the
   parent can read it back. Sign-in itself checks a hashed copy. In the real
   backend (Part 4) only a hash is stored, and "show the default PIN" is
   replaced by "generate a new PIN and show it once". */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;

    var parent = RW.auth.requireParent();
    if (!parent) { return; }
    var pid = parent.parentId;

    /* ---------- own account ---------- */

    function showAccount() {
        var fresh = RW.store.getParentById(pid);
        byId('account-name').textContent = fresh.name;
        byId('account-email').textContent = fresh.email;
        byId('current-email').textContent = fresh.email;
    }

    /* A value hidden until the parent presses Show. */
    function secretCell(secret, noun, owner) {
        var value = el('span', { class: 'pin-value', text: 'Hidden' });
        var button = el('button', { type: 'button', class: 'btn btn-secondary btn-sm' });
        function paint(shown) {
            value.textContent = shown ? secret : 'Hidden';
            button.textContent = (shown ? 'Hide ' : 'Show ') + noun;
            button.setAttribute('aria-label', (shown ? 'Hide ' : 'Show ') + noun + (owner ? ' for ' + owner : ''));
            button.setAttribute('data-shown', shown ? 'true' : 'false');
        }
        button.addEventListener('click', function () { paint(button.getAttribute('data-shown') !== 'true'); });
        paint(false);
        return el('span', {}, [value, button]);
    }

    function formAlert(prefix, message) {
        var box = byId(prefix + '-alert');
        byId(prefix + '-alert-text').textContent = message;
        box.hidden = false;
        box.setAttribute('tabindex', '-1');
        box.focus();
    }

    function note(id, message) {
        var n = byId(id);
        n.textContent = message;
    }

    var emailForm = byId('email-form');
    emailForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(emailForm);
        note('email-note', '');
        var email = byId('new-email').value;
        var password = byId('email-password').value;

        var ok = true;
        if (!email.trim()) { ui.setFieldError('new-email', 'Enter your new email address.'); ok = false; }
        if (!password) { ui.setFieldError('email-password', 'Enter your current password.'); ok = false; }
        if (!ok) { ui.focusFirstInvalid(emailForm); return; }

        RW.auth.changeParentEmailFirebase(password, email).then(function (result) {
            if (!result.ok) {
                if (result.field === 'email') { ui.setFieldError('new-email', result.error); ui.focusFirstInvalid(emailForm); }
                else if (result.field === 'current') { ui.setFieldError('email-password', result.error); ui.focusFirstInvalid(emailForm); }
                else { formAlert('email', result.error); }
                return;
            }
            emailForm.reset();
            note('email-note', 'We sent a confirmation link to ' + result.email + '. Your email changes after you open that link. Until then, keep using your current email.');
        });
    });

    var passwordForm = byId('password-form');
    ui.bindShowToggle('show-passwords', ['current-password', 'new-password', 'confirm-password']);
    passwordForm.addEventListener('submit', function (event) {
        event.preventDefault();
        ui.clearErrors(passwordForm);
        note('password-note', '');
        var current = byId('current-password').value;
        var next = byId('new-password').value;
        var confirm = byId('confirm-password').value;

        var ok = true;
        if (!current) { ui.setFieldError('current-password', 'Enter your current password.'); ok = false; }
        if (!next) { ui.setFieldError('new-password', 'Enter a new password.'); ok = false; }
        if (!confirm) { ui.setFieldError('confirm-password', 'Type the new password again to confirm it.'); ok = false; }
        if (!ok) { ui.focusFirstInvalid(passwordForm); return; }

        RW.auth.changeParentPasswordFirebase(current, next, confirm).then(function (result) {
            if (!result.ok) {
                var map = { current: 'current-password', new: 'new-password', confirm: 'confirm-password' };
                if (result.field && map[result.field]) { ui.setFieldError(map[result.field], result.error); ui.focusFirstInvalid(passwordForm); }
                else { formAlert('password', result.error); }
                return;
            }
            passwordForm.reset();
            // Make sure the fields go back to hidden after a reset.
            ['current-password', 'new-password', 'confirm-password'].forEach(function (i) { byId(i).type = 'password'; });
            note('password-note', 'Your password was changed. You are still signed in.');
        });
    });

    /* Show how this parent signs in. Parents who use Google have no ReadWell
       password or email to change, so those two forms are hidden for them. */
    RW.auth.parentProviders().then(function (providers) {
        var usesPassword = !!providers && providers.indexOf('password') >= 0;
        var usesGoogle = !!providers && providers.indexOf('google.com') >= 0;
        byId('account-signin').textContent = usesPassword ? 'Email and password' + (usesGoogle ? ' and Google' : '') :
            (usesGoogle ? 'Google' : 'Not available. Please log in again.');
        if (!usesPassword) {
            byId('email-section').hidden = true;
            byId('password-section').hidden = true;
            byId('account-hint').textContent = usesGoogle
                ? 'You sign in with Google, so your email and password are managed in your Google account.'
                : 'Please log out and log in again to change your account settings.';
        }
    });
    byId('logout').addEventListener('click', RW.auth.logout);

    /* ---------- student account management ---------- */

    function field(id, label, attrs, hint) {
        var input = el('input', Object.assign({ id: id, type: 'text', autocomplete: 'off' }, attrs || {}));
        return el('div', { class: 'form-field' }, [
            el('label', { for: id, text: label }),
            input,
            hint ? el('p', { class: 'field-hint', text: hint }) : null,
            el('p', { class: 'field-error', id: id + '-error', hidden: '' })
        ]);
    }

    function studentCard(child) {
        var cid = child.studentId;
        var card = el('section', { class: 'card account-card', 'aria-labelledby': 'name-' + cid });
        card.appendChild(el('h3', { id: 'name-' + cid, text: child.name }));

        var dl = el('dl', { class: 'details' });
        dl.appendChild(el('dt', { text: 'Student name' }));
        dl.appendChild(el('dd', { text: child.name }));
        dl.appendChild(el('dt', { text: 'Username' }));
        dl.appendChild(el('dd', {}, [el('span', { class: 'mono', text: child.username })]));
        dl.appendChild(el('dt', { text: 'Default PIN' }));
        dl.appendChild(el('dd', {}, [child.displayPin
            ? secretCell(child.displayPin, 'PIN', child.name)
            : el('span', { text: 'Not shown. A PIN you chose is in use.' })]));
        card.appendChild(dl);

        /* AI study tips opt-in */
        var tipsOn = RW.store.getAiTips(cid);
        var tipsBox = el('input', { type: 'checkbox', id: 'tips-' + cid });
        tipsBox.checked = tipsOn;
        tipsBox.addEventListener('change', function () {
            var ok = RW.store.setAiTips(cid, pid, tipsBox.checked);
            var note = byId('status-' + cid);
            if (note) { note.textContent = ok ? (tipsBox.checked ? 'AI study tips are on for ' + child.name + '.' : 'AI study tips are off for ' + child.name + '.') : 'We could not save the change.'; }
        });
        var tipsInfo = el('button', { type: 'button', class: 'info-btn', 'aria-expanded': 'false', 'aria-controls': 'tips-info-' + cid, 'aria-label': 'More info: AI study tips' }, ['i']);
        tipsInfo.addEventListener('click', function () {
            var box = byId('tips-info-' + cid), open = tipsInfo.getAttribute('aria-expanded') !== 'true';
            tipsInfo.setAttribute('aria-expanded', open ? 'true' : 'false');
            box.hidden = !open;
        });
        card.appendChild(el('div', { class: 'tips-optin' }, [
            el('div', { class: 'tips-head' }, [
                el('label', { for: 'tips-' + cid }, [tipsBox, ' Allow AI study tips and answer feedback']),
                tipsInfo
            ]),
            el('p', { class: 'hint', hidden: '', id: 'tips-info-' + cid, text: 'Adds a "Get study tips" button to ' + child.name + "'s Progress page and a short coach note after each quiz answer. Only skill names, percentages, a question id and the chosen answer are sent to Google Gemini. No name, username or school is ever sent. Off by default." })
        ]));

        var status = el('p', { class: 'save-note', role: 'status', id: 'status-' + cid });

        /* Change username */
        var uForm = el('form', { class: 'inline-form', novalidate: '' }, [
            field('u-' + cid, 'New username', { maxlength: '20', autocapitalize: 'none', placeholder: 'e.g. amber_reads' }, '3 to 20 letters, numbers or underscores.'),
            el('button', { type: 'submit', class: 'btn btn-secondary', text: 'Change username' })
        ]);
        uForm.addEventListener('submit', function (e) {
            e.preventDefault();
            ui.clearErrors(uForm);
            var result = RW.auth.changeStudentUsername(pid, cid, byId('u-' + cid).value);
            if (!result.ok) { ui.setFieldError('u-' + cid, result.error); ui.focusFirstInvalid(uForm); return; }
            render('Username changed for ' + child.name + '.', cid);
        });

        /* Make a new generated PIN */
        var gen = el('button', { type: 'button', class: 'btn btn-secondary', text: 'Make a new PIN' });
        gen.addEventListener('click', function () {
            var result = RW.auth.resetStudentPin(pid, cid, null);
            render(result.ok ? 'A new PIN was made for ' + child.name + '. The old PIN no longer works.' : result.error, cid);
        });

        /* Choose a PIN */
        var pForm = el('form', { class: 'inline-form', novalidate: '' }, [
            field('p-' + cid, 'Choose a 4-digit PIN', { inputmode: 'numeric', maxlength: '4', pattern: '[0-9]*', placeholder: '4 digits' }, 'A PIN you choose is not shown again later. When a PIN changes, the old one stops working right away.'),
            el('button', { type: 'submit', class: 'btn btn-secondary', text: 'Save PIN' })
        ]);
        pForm.addEventListener('submit', function (e) {
            e.preventDefault();
            ui.clearErrors(pForm);
            var result = RW.auth.resetStudentPin(pid, cid, byId('p-' + cid).value.trim());
            if (!result.ok) { ui.setFieldError('p-' + cid, result.error); ui.focusFirstInvalid(pForm); return; }
            render('The PIN for ' + child.name + ' was changed. The old PIN no longer works.', cid);
        });

        card.appendChild(el('div', { class: 'account-forms' }, [
            el('div', {}, [el('h4', { text: 'Username' }), uForm]),
            el('div', {}, [el('h4', { text: 'PIN' }),
                
                el('div', { class: 'button-row' }, [gen]), pForm]),
            status
        ]));
        return card;
    }

    function render(message, targetId) {
        var box = byId('student-accounts');
        ui.clear(box);
        var children = RW.store.getStudentsByParent(pid);
        if (!children.length) {
            box.appendChild(el('div', { class: 'card empty-card' }, [
                el('h3', { text: 'No children yet' }),
                el('p', {}, ['Add a child profile first. ', el('a', { href: 'add-child.html', text: 'Add a child' })])
            ]));
            return;
        }
        children.forEach(function (c) { box.appendChild(studentCard(c)); });
        ui.enhanceHints(box);
        if (message && targetId) {
            var target = byId('status-' + targetId);
            if (target) { target.textContent = message; }
        }
    }

    ui.enhanceHints(document);
    showAccount();
    render();
})();
