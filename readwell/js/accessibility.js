/* ReadWell — accessibility.html: presets and individual reading settings */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var prefs = RW.settings;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    prefs.init(id);

    var GROUPS = [
        { key: 'textSize', legend: 'Text size', hint: 'How big the words are.',
          options: [['standard', 'Standard'], ['large', 'Large'], ['xlarge', 'Extra Large']] },
        { key: 'lineSpacing', legend: 'Line spacing', hint: 'The space between lines of text.',
          options: [['standard', 'Standard'], ['relaxed', 'Relaxed'], ['wide', 'Wide']] },
        { key: 'letterSpacing', legend: 'Letter spacing', hint: 'The space between letters.',
          options: [['standard', 'Standard'], ['increased', 'Increased']] },
        { key: 'displayMode', legend: 'Display mode', hint: 'Light, Dark, or High Contrast (black with bright yellow and white).',
          options: [['light', 'Light'], ['dark', 'Dark'], ['contrast', 'High Contrast']] },
        { key: 'readingWidth', legend: 'Reading width', hint: 'Comfortable makes lines of the story shorter and easier to follow.',
          options: [['standard', 'Standard'], ['comfortable', 'Comfortable']] },
        { key: 'speechRate', legend: 'Reading aloud speed', hint: 'How fast text-to-speech talks.',
          options: [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']] },
        { key: 'motion', legend: 'Motion', hint: 'Reduced motion turns off animations and smooth scrolling.',
          options: [['standard', 'Standard'], ['reduced', 'Reduced motion']] }
    ];

    var saveTimer = null;

    function radio(name, value, label, description) {
        var input = el('input', { type: 'radio', name: name, value: value });
        var text = el('span', {}, [label]);
        if (description) { text.appendChild(el('small', { text: description })); }
        return el('label', { class: 'choice' }, [input, text]);
    }

    function build() {
        var presetGrid = byId('preset-grid');
        prefs.PRESET_ORDER.forEach(function (key) {
            var p = prefs.PRESETS[key];
            presetGrid.appendChild(radio('preset', key, p.label, p.description));
        });
        presetGrid.addEventListener('change', function (e) {
            if (e.target.name !== 'preset') { return; }
            prefs.setPreset(id, e.target.value);
            sync();
            saved();
        });

        var holder = byId('setting-groups');
        GROUPS.forEach(function (g) {
            var fs = el('fieldset', { class: 'choice-fieldset' }, [
                el('legend', { text: g.legend }),
                el('p', { class: 'field-hint', text: g.hint })
            ]);
            var row = el('div', { class: 'choices' });
            g.options.forEach(function (o) { row.appendChild(radio(g.key, o[0], o[1])); });
            row.addEventListener('change', function (e) {
                if (e.target.name !== g.key) { return; }
                var patch = {};
                patch[g.key] = e.target.value;
                prefs.set(id, patch);
                sync();
                saved();
            });
            fs.appendChild(row);
            holder.appendChild(fs);
        });
    }

    /* Show the saved values in the radio buttons and the preset line. */
    function sync() {
        var s = prefs.get(id);
        var preset = prefs.detectPreset(s);
        var inputs = document.querySelectorAll('input[type="radio"]');
        Array.prototype.forEach.call(inputs, function (input) {
            var expected = input.name === 'preset' ? preset : s[input.name];
            input.checked = input.value === expected;
        });
        byId('preset-current').textContent = 'Current preset: ' +
            (preset === 'custom' ? 'Custom (your own mix of settings).' : prefs.PRESETS[preset].label + '.');
    }

    function saved() {
        var note = byId('save-note');
        note.textContent = 'Saved.';
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(function () { note.textContent = ''; }, 3000);
    }

    byId('reset-button').addEventListener('click', function () {
        prefs.reset(id);
        sync();
        var note = byId('save-note');
        note.textContent = 'Back to standard settings.';
    });

    RW.tts.mount(byId('tts-sample'), {
        label: 'Listen to the sample',
        getText: function () { return document.querySelector('.preview .passage-text').textContent; },
        getRate: function () { return prefs.speechRate(id); }
    });

    build();
    sync();
})();
