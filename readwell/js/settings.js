/* =========================================================
   ReadWell — student accessibility preferences
   Saved per student in localStorage (rw_settings). Loaded on every
   student page, so the chosen text size, spacing and display mode apply
   everywhere. The settings are written to data-* attributes on <html>
   and the stylesheet does the rest.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var doc = global.document;

    var OPTIONS = {
        textSize: ['standard', 'large', 'xlarge'],
        lineSpacing: ['standard', 'relaxed', 'wide'],
        letterSpacing: ['standard', 'increased'],
        displayMode: ['light', 'dark', 'contrast'],
        readingWidth: ['standard', 'comfortable'],
        speechRate: ['slow', 'normal', 'fast'],
        motion: ['standard', 'reduced'],
        timer: ['off', 'on']
    };

    var DEFAULTS = {
        textSize: 'standard',
        lineSpacing: 'standard',
        letterSpacing: 'standard',
        displayMode: 'light',
        readingWidth: 'standard',
        speechRate: 'normal',
        motion: 'standard',
        timer: 'off',
        difficulty: 'beginner'
    };

    /* Presets change several settings at once. A preset that leaves
       displayMode out keeps whatever mode the student already chose. */
    var PRESETS = {
        standard: {
            label: 'Standard',
            description: 'Normal text size and spacing.',
            values: { textSize: 'standard', lineSpacing: 'standard', letterSpacing: 'standard', readingWidth: 'standard', displayMode: 'light' }
        },
        easy: {
            label: 'Easy Reading',
            description: 'Larger text with more space between lines and letters.',
            values: { textSize: 'large', lineSpacing: 'relaxed', letterSpacing: 'increased', readingWidth: 'standard' }
        },
        focused: {
            label: 'Focused Reading',
            description: 'More space between lines and a narrower, comfortable line length.',
            values: { textSize: 'standard', lineSpacing: 'relaxed', letterSpacing: 'standard', readingWidth: 'comfortable' }
        },
        readability: {
            label: 'High Readability',
            description: 'Larger text, more space between letters and stronger contrast.',
            values: { textSize: 'large', lineSpacing: 'standard', letterSpacing: 'increased', readingWidth: 'standard', displayMode: 'contrast' }
        }
    };

    var PRESET_ORDER = ['standard', 'easy', 'focused', 'readability'];

    var RATES = { slow: 0.8, normal: 1, fast: 1.2 };

    /* Stored values are checked, so a damaged entry falls back to the default. */
    function clean(raw) {
        var out = {};
        Object.keys(DEFAULTS).forEach(function (key) {
            var value = raw && raw[key];
            if (OPTIONS[key]) {
                out[key] = OPTIONS[key].indexOf(value) >= 0 ? value : DEFAULTS[key];
            } else if (key === 'difficulty') {
                out[key] = RW.content && RW.content.isLevel(value) ? value : DEFAULTS[key];
            }
        });
        return out;
    }

    function get(studentId) {
        return clean(RW.store.getSettings(studentId));
    }

    /* Which preset do the current values match? Otherwise "custom". */
    function detectPreset(settings) {
        for (var i = 0; i < PRESET_ORDER.length; i++) {
            var values = PRESETS[PRESET_ORDER[i]].values;
            var same = Object.keys(values).every(function (k) { return settings[k] === values[k]; });
            if (same) { return PRESET_ORDER[i]; }
        }
        return 'custom';
    }

    function apply(settings) {
        var s = clean(settings);
        var root = doc.documentElement;
        root.setAttribute('data-text', s.textSize);
        root.setAttribute('data-line', s.lineSpacing);
        root.setAttribute('data-letter', s.letterSpacing);
        root.setAttribute('data-mode', s.displayMode);
        root.setAttribute('data-width', s.readingWidth);
        root.setAttribute('data-motion', s.motion);
    }

    /* Saves only valid values, applies them and returns the full settings. */
    function set(studentId, partial) {
        var next = clean(Object.assign({}, get(studentId), partial));
        var saved = RW.store.saveSettings(studentId, next);
        apply(next);
        return saved ? next : null;
    }

    function setPreset(studentId, presetKey) {
        var preset = PRESETS[presetKey];
        if (!preset) { return null; }
        return set(studentId, preset.values);
    }

    function reset(studentId) {
        RW.store.resetSettings(studentId);
        var s = get(studentId);
        apply(s);
        return s;
    }

    function speechRate(studentId) {
        return RATES[get(studentId).speechRate] || 1;
    }

    /* Call once from a student page after the student is known. */
    function init(studentId) {
        apply(get(studentId));
    }

    RW.settings = {
        OPTIONS: OPTIONS,
        DEFAULTS: DEFAULTS,
        PRESETS: PRESETS,
        PRESET_ORDER: PRESET_ORDER,
        clean: clean,
        get: get,
        set: set,
        setPreset: setPreset,
        reset: reset,
        detectPreset: detectPreset,
        apply: apply,
        speechRate: speechRate,
        init: init
    };
})(window);
