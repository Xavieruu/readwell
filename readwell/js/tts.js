/* =========================================================
   ReadWell — text to speech (browser Web Speech API only)
   No outside voice service. Never starts by itself: speech begins only
   when the student presses Play. Controls: Play, Pause, Resume, Stop.
   Long text is spoken in short pieces, which keeps browsers from
   cutting the voice off part-way through.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var doc = global.document;

    var UNSUPPORTED = 'Text-to-speech is not supported by this browser.';
    var active = null;   // the one controller that is currently speaking

    function supported() {
        return !!(global.speechSynthesis && global.SpeechSynthesisUtterance);
    }

    /* Split text into pieces of at most ~180 characters, at sentence ends. */
    function chunk(text) {
        var sentences = String(text).replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*["'”’)]*\s*/g) || [];
        var pieces = [], current = '';
        sentences.forEach(function (s) {
            if (current && (current + s).length > 180) {
                pieces.push(current.trim());
                current = '';
            }
            current += s;
        });
        if (current.trim()) { pieces.push(current.trim()); }
        return pieces;
    }

    function button(label, onClick) {
        var b = doc.createElement('button');
        b.type = 'button';
        b.className = 'btn btn-secondary btn-sm';
        b.textContent = label;
        b.addEventListener('click', onClick);
        return b;
    }

    /* mount(container, { label, getText, getRate })
       Puts the four buttons and a status line into `container`. */
    function mount(container, options) {
        container.textContent = '';
        container.classList.add('tts');

        if (!supported()) {
            var note = doc.createElement('p');
            note.className = 'tts-unsupported';
            note.textContent = UNSUPPORTED;
            container.appendChild(note);
            return { stop: function () {}, supported: false, state: function () { return 'unsupported'; } };
        }

        var synth = global.speechSynthesis;
        var state = 'idle';           // idle | playing | paused
        var token = 0;                // changes on every Play/Stop so old callbacks are ignored
        var pieces = [];
        var index = 0;

        var group = doc.createElement('div');
        group.className = 'tts-buttons';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', options.label);

        var play = button('Play', onPlay);
        var pause = button('Pause', onPause);
        var resume = button('Resume', onResume);
        var stop = button('Stop', onStop);
        [play, pause, resume, stop].forEach(function (b) { group.appendChild(b); });

        var status = doc.createElement('p');
        status.className = 'tts-status';
        status.setAttribute('role', 'status');

        container.appendChild(group);
        container.appendChild(status);

        var controller = { stop: onStop, supported: true, state: function () { return state; } };

        function render() {
            play.hidden = state !== 'idle';
            pause.hidden = state !== 'playing';
            resume.hidden = state !== 'paused';
            stop.disabled = state === 'idle';
            status.textContent = state === 'playing' ? 'Reading aloud...'
                : state === 'paused' ? 'Paused.' : '';
        }

        function finish() {
            state = 'idle';
            if (active === controller) { active = null; }
            render();
        }

        function speakNext(myToken) {
            if (myToken !== token) { return; }
            if (index >= pieces.length) { finish(); return; }
            var u = new global.SpeechSynthesisUtterance(pieces[index]);
            index += 1;
            u.rate = options.getRate ? options.getRate() : 1;
            u.onend = function () { speakNext(myToken); };
            u.onerror = function () { if (myToken === token) { finish(); } };
            synth.speak(u);
        }

        function onPlay() {
            if (active && active !== controller) { active.stop(); }
            synth.cancel();
            pieces = chunk(options.getText());
            if (!pieces.length) { return; }
            index = 0;
            token += 1;
            state = 'playing';
            active = controller;
            render();
            speakNext(token);
        }

        function onPause() {
            if (state !== 'playing') { return; }
            synth.pause();
            state = 'paused';
            render();
        }

        function onResume() {
            if (state !== 'paused') { return; }
            synth.resume();
            state = 'playing';
            render();
        }

        function onStop() {
            token += 1;
            if (state !== 'idle') {
                synth.cancel();
                if (state === 'paused') { synth.resume(); }   // some browsers stay paused after cancel
            }
            finish();
        }

        global.addEventListener('pagehide', function () { if (state !== 'idle') { onStop(); } });
        render();
        return controller;
    }

    RW.tts = { UNSUPPORTED: UNSUPPORTED, supported: supported, chunk: chunk, mount: mount };
})(window);
