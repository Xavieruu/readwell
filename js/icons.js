/* =========================================================
   ReadWell — small icon set (inline SVG, no downloads)
   RW.icons.svg('book') returns an <svg> string that uses the text colour,
   so icons follow light / dark / high-contrast modes automatically.
   Any element with data-icon="name" gets that icon placed inside it.
   Icons are decorative (aria-hidden); the text next to them says the same thing.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    /* Each value is the inside of a 24x24 SVG drawn with strokes. */
    var PATHS = {
        book: '<path d="M2.5 5.5C4.5 4.5 8 4.3 12 6.5c4-2.2 7.5-2 9.5-1v13c-2-1-5.5-1.2-9.5 1-4-2.2-7.5-2-9.5-1z"/><path d="M12 6.5v13"/>',
        home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',
        chart: '<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16v-4"/><path d="M12 16V8"/><path d="M16 16v-6"/>',
        bookmark: '<path d="M6 3.5h12v17l-6-4.5-6 4.5z"/>',
        history: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
        settings: '<path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/>',
        user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>',
        users: '<circle cx="9" cy="8.5" r="3"/><path d="M3 19.5c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 5.8a3 3 0 0 1 0 5.4"/><path d="M17.5 14.8c2.2.5 3.5 2.1 3.5 4.7"/>',
        pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
        eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
        logout: '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"/><path d="M15 8l4 4-4 4"/><path d="M9 12h10"/>',
        login: '<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10 8l-4 4 4 4" transform="translate(4 0)"/><path d="M4 12h10"/>',
        plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
        star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"/>',
        check: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12.3 2.8 2.8L16.2 9.5"/>',
        target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
        pencil: '<path d="M4 20l1-4L16.5 4.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8 19z"/><path d="M14.5 6.5l3 3"/>',
        shield: '<path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.2 7 9 4.2-1.8 7-4.8 7-9V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
        keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M17 10h.01M7 14h10"/>',
        text: '<path d="M5 6.5h14"/><path d="M12 6.5V19"/><path d="M9 19h6"/>',
        leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19c2-4 5-7 9-9"/>',
        key: '<circle cx="8" cy="15" r="3.5"/><path d="m10.5 12.5 8-8"/><path d="m16 7 2.5 2.5"/>',
        mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7.5 8 6 8-6"/>'
    };

    function svg(name, extraClass) {
        var inner = PATHS[name];
        if (!inner) { return ''; }
        return '<svg class="icon' + (extraClass ? ' ' + extraClass : '') + '" width="24" height="24" viewBox="0 0 24 24" ' +
            'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
            'aria-hidden="true" focusable="false">' + inner + '</svg>';
    }

    /* Fill every <span data-icon="name"> on the page. */
    function fill(root) {
        var nodes = (root || global.document).querySelectorAll('[data-icon]');
        for (var i = 0; i < nodes.length; i++) {
            if (!nodes[i].firstChild) { nodes[i].innerHTML = svg(nodes[i].getAttribute('data-icon')); }
        }
    }


    /* A friendly open-book picture with twinkling stars (decorative). The CSS in
       animations.css floats it, turns the page and twinkles the stars. */
    var BOOK_ART =
        '<svg class="art art-book" viewBox="0 0 240 180" role="img" aria-label="" aria-hidden="true" focusable="false">' +
        '<g class="art-float">' +
        '<path class="art-cover" d="M24 70c32-12 70-12 96 6 26-18 64-18 96-6v76c-32-12-70-12-96 6-26-18-64-18-96-6z"/>' +
        '<path class="art-pages" d="M34 74c28-9 58-8 86 6v66c-28-14-58-15-86-6z"/>' +
        '<path class="art-pages art-page" d="M206 74c-28-9-58-8-86 6v66c28-14 58-15 86-6z"/>' +
        '<path class="art-line" d="M120 80v66"/>' +
        '<path class="art-line" d="M48 90c20-5 42-4 60 4M48 104c20-5 42-4 60 4M48 118c20-5 42-4 60 4"/>' +
        '<path class="art-line" d="M132 94c18-8 40-9 60-4M132 108c18-8 40-9 60-4"/>' +
        '</g>' +
        '<g transform="translate(46 34)"><path class="art-star art-twinkle" d="M0-11 3-3 11 0 3 3 0 11-3 3-11 0-3-3z"/></g>' +
        '<g transform="translate(196 28)"><path class="art-star art-twinkle d2" d="M0-8 2.2-2.2 8 0 2.2 2.2 0 8-2.2 2.2-8 0-2.2-2.2z"/></g>' +
        '<g transform="translate(120 20)"><path class="art-star art-twinkle d3" d="M0-6 1.6-1.6 6 0 1.6 1.6 0 6-1.6 1.6-6 0-1.6-1.6z"/></g>' +
        '</svg>';

    var ARTS = { book: BOOK_ART };

    /* Fill every <div data-art="book"> with the picture. */
    function fillArt(root) {
        var nodes = (root || global.document).querySelectorAll('[data-art]');
        for (var i = 0; i < nodes.length; i++) {
            var markup = ARTS[nodes[i].getAttribute('data-art')];
            if (markup && !nodes[i].firstChild) { nodes[i].innerHTML = markup; }
        }
    }

    RW.icons = { svg: svg, fill: fill, fillArt: fillArt, names: Object.keys(PATHS) };

    function run() { fill(); fillArt(); }
    if (global.document.readyState === 'loading') {
        global.document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})(window);
