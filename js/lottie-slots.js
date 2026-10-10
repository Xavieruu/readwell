/* =========================================================
   ReadWell — optional Lottie animations
   Any element like
       <div class="lottie-slot" data-lottie="assets/animations/hero-book.json"> ...fallback SVG... </div>
   shows the inline SVG inside it. If the .json file exists (for example one you
   downloaded from LottieFiles) and the browser is allowed to load it, the file
   is played instead. If the file is missing, the page is opened straight from a
   folder (file://), or motion is reduced, the SVG simply stays. Nothing breaks.

   The player is the local file assets/vendor/lottie_light.min.js
   (lottie-web, MIT licence). It is only loaded when a slot's file is found.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var doc = global.document;

    function motionReduced() {
        var root = doc.documentElement;
        if (root.getAttribute('data-motion') === 'reduced') { return true; }
        return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    function loadPlayer(done) {
        if (global.lottie) { done(); return; }
        var s = doc.createElement('script');
        s.src = RW.url('assets/vendor/lottie_light.min.js');
        s.onload = done;
        doc.head.appendChild(s);
    }

    function start(slot) {
        var path = slot.getAttribute('data-lottie');
        // Browsers block fetch() on file:// pages, so only try over http(s).
        if (!path || !global.fetch || global.location.protocol === 'file:') { return; }
        global.fetch(RW.url(path)).then(function (r) {
            if (!r.ok) { throw new Error('missing'); }
            return r.json();
        }).then(function (data) {
            loadPlayer(function () {
                if (!global.lottie) { return; }
                var holder = doc.createElement('div');
                slot.appendChild(holder);
                var anim = global.lottie.loadAnimation({
                    container: holder, renderer: 'svg', loop: true, autoplay: true, animationData: data
                });
                anim.addEventListener('DOMLoaded', function () {
                    // Hide the fallback only once the real animation is drawn.
                    var kids = slot.children;
                    for (var i = 0; i < kids.length; i++) { if (kids[i] !== holder) { kids[i].setAttribute('hidden', ''); } }
                });
            });
        }).catch(function () { /* keep the SVG fallback */ });
    }

    function init() {
        var slots = doc.querySelectorAll('[data-lottie]');
        if (!slots.length || motionReduced()) { return; }
        for (var i = 0; i < slots.length; i++) { start(slots[i]); }
    }

    RW.lottie = { init: init };
    if (doc.readyState === 'loading') { doc.addEventListener('DOMContentLoaded', init); } else { init(); }
})(window);
