/* ReadWell — student/profile.html
   Shows the student's own details (read only) and the reading timer option.
   Account details (name, username, PIN) can only be changed by a parent. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, byId = ui.byId;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    RW.settings.init(id);

    byId('p-name').textContent = student.name;
    byId('p-grade').textContent = student.gradeLevel;
    byId('p-username').textContent = student.username;

    var current = RW.settings.get(id);
    var preset = RW.settings.detectPreset(current);
    byId('p-summary').textContent = 'Current preset: ' +
        (preset === 'custom' ? 'Custom' : RW.settings.PRESETS[preset].label) + '.';

    var radios = document.querySelectorAll('input[name="timer"]');
    Array.prototype.forEach.call(radios, function (radio) {
        radio.checked = radio.value === current.timer;
        radio.addEventListener('change', function () {
            if (!radio.checked) { return; }
            RW.settings.set(id, { timer: radio.value });
            byId('timer-note').textContent = radio.value === 'on'
                ? 'Timer is on. It will show while you read.'
                : 'Timer is off.';
        });
    });

    byId('logout').addEventListener('click', RW.auth.logout);
})();
