/* =========================================================
   ReadWell — highlight helpers (pure functions, no DOM)
   A highlight is { id, p, start, end, text, note }:
     p      paragraph number (0 = first paragraph)
     start/end   character positions inside that paragraph's text
   The reader page uses these to draw highlights and to keep them valid.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    function overlaps(a, b) {
        return a.p === b.p && a.start < b.end && b.start < a.end;
    }

    /* Adds a highlight. Returns { ok, highlights, added } or { ok:false, error }. */
    function addHighlight(list, paragraphs, p, start, end) {
        if (typeof p !== 'number' || p < 0 || p >= paragraphs.length) {
            return { ok: false, error: 'Choose words inside the story.' };
        }
        var text = paragraphs[p];
        // Trim spaces from both ends of the selection.
        while (start < end && /\s/.test(text.charAt(start))) { start += 1; }
        while (end > start && /\s/.test(text.charAt(end - 1))) { end -= 1; }
        if (start < 0 || end > text.length || end - start < 1) {
            return { ok: false, error: 'Select some words in the story first.' };
        }
        var candidate = { p: p, start: start, end: end };
        for (var i = 0; i < list.length; i++) {
            if (overlaps(list[i], candidate)) {
                return { ok: false, error: 'Part of that is already highlighted. Choose different words, or edit the existing highlight.' };
            }
        }
        var max = 0;
        list.forEach(function (h) {
            var m = String(h.id).match(/(\d+)$/);
            if (m) { max = Math.max(max, parseInt(m[1], 10)); }
        });
        var added = {
            id: 'h' + (max + 1), p: p, start: start, end: end,
            text: text.slice(start, end), note: ''
        };
        return { ok: true, highlights: list.concat([added]), added: added };
    }

    function removeHighlight(list, id) {
        return list.filter(function (h) { return h.id !== id; });
    }

    function setNote(list, id, note) {
        return list.map(function (h) {
            if (h.id !== id) { return h; }
            return { id: h.id, p: h.p, start: h.start, end: h.end, text: h.text, note: String(note).slice(0, 500) };
        });
    }

    /* Highlights whose saved text still matches the story (a safety check). */
    function valid(list, paragraphs) {
        return list.filter(function (h) {
            return typeof h.p === 'number' && paragraphs[h.p] !== undefined &&
                paragraphs[h.p].slice(h.start, h.end) === h.text;
        });
    }

    /* Cuts one paragraph into pieces: [{ text, highlight|null }, ...] */
    function segments(paragraphText, list, p) {
        var mine = list.filter(function (h) { return h.p === p; })
            .sort(function (a, b) { return a.start - b.start; });
        var out = [], pos = 0;
        mine.forEach(function (h) {
            if (h.start > pos) { out.push({ text: paragraphText.slice(pos, h.start), highlight: null }); }
            out.push({ text: paragraphText.slice(h.start, h.end), highlight: h });
            pos = h.end;
        });
        if (pos < paragraphText.length) { out.push({ text: paragraphText.slice(pos), highlight: null }); }
        return out;
    }

    RW.annotations = {
        addHighlight: addHighlight,
        removeHighlight: removeHighlight,
        setNote: setNote,
        valid: valid,
        segments: segments
    };
})(window);
