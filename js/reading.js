/* =========================================================
   ReadWell — reading.html
   Two views in one page:
     Library  (no ?story=)   pick a level and a story
     Reader   (?story=ID)    read, answer, use hints, highlight, listen
   Rules for scoring, hints and feedback live in engine.js.
   ========================================================= */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content, engine = RW.questions, store = RW.store, ann = RW.annotations;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var studentId = student.studentId;
    RW.settings.init(studentId);

    var params = new URLSearchParams(window.location.search);
    var storyParam = params.get('story');

    function show(id) {
        ['library-view', 'reader-view', 'missing-view'].forEach(function (v) { byId(v).hidden = v !== id; });
    }

    if (storyParam === null) {
        initLibrary();
    } else {
        var story = content.getStory(storyParam);
        if (!story) {
            show('missing-view');
            document.title = 'Story not found | ReadWell';
        } else {
            initReader(story);
        }
    }

    /* ---------- bookmarks ---------- */

    /* A toggle button. The text changes too, so it never relies on colour alone. */
    function bookmarkButton(story, small) {
        var button = el('button', { type: 'button', class: 'btn btn-secondary' + (small ? ' btn-sm' : '') });
        function paint() {
            var on = store.getBookmarks(studentId).indexOf(story.storyId) >= 0;
            button.textContent = on ? '★ Bookmarked' : '☆ Bookmark';
            button.setAttribute('aria-pressed', on ? 'true' : 'false');
            button.setAttribute('aria-label', (on ? 'Remove bookmark for ' : 'Bookmark ') + story.title);
        }
        button.addEventListener('click', function () {
            store.toggleBookmark(studentId, story.storyId);
            paint();
        });
        paint();
        return button;
    }

    /* ---------- library ---------- */

    function initLibrary() {
        show('library-view');
        var settings = RW.settings.get(studentId);
        var requested = params.get('level');
        var level = content.isLevel(requested) ? requested : settings.difficulty;

        var buttons = byId('level-buttons');
        content.LEVELS.forEach(function (l) {
            var b = el('button', { type: 'button', class: 'btn btn-secondary', 'data-level': l.key, 'aria-pressed': 'false', text: l.label });
            b.addEventListener('click', function () {
                level = l.key;
                RW.settings.set(studentId, { difficulty: level });
                renderLibrary();
            });
            buttons.appendChild(b);
        });

        function renderLibrary() {
            var info = content.LEVELS.filter(function (l) { return l.key === level; })[0];
            var all = buttons.querySelectorAll('button');
            for (var i = 0; i < all.length; i++) {
                all[i].setAttribute('aria-pressed', all[i].getAttribute('data-level') === level ? 'true' : 'false');
            }
            var stories = content.getStories(level);
            byId('level-blurb').textContent = info.blurb + ' ' + stories.length + ' stories.';
            byId('stories-heading').textContent = info.label + ' stories';

            var list = byId('story-list');
            ui.clear(list);
            stories.forEach(function (s) { list.appendChild(storyCard(s)); });
        }

        renderLibrary();
    }

    function storyCard(s) {
        var st = engine.storyStatus(studentId, s);
        var badge;
        if (st.open) {
            badge = 'In progress';
        } else if (st.latest) {
            badge = 'Completed: ' + st.latest.summary.percent + '%';
        } else {
            badge = 'Not started';
        }

        var actions = el('div', { class: 'button-row' });
        var readUrl = 'reading.html?story=' + encodeURIComponent(s.storyId);
        if (st.open) {
            actions.appendChild(el('a', { class: 'btn btn-primary btn-sm', href: readUrl, text: 'Continue' }));
        } else if (st.latest) {
            actions.appendChild(el('a', { class: 'btn btn-primary btn-sm', href: readUrl, text: 'Practice again' }));
            actions.appendChild(el('a', { class: 'btn btn-secondary btn-sm', href: 'results.html?attempt=' + encodeURIComponent(st.latest.attemptId), text: 'View results' }));
        } else {
            actions.appendChild(el('a', { class: 'btn btn-primary btn-sm', href: readUrl, text: 'Start reading' }));
        }

        actions.appendChild(bookmarkButton(s, true));

        return el('li', {}, [el('article', { class: 'story-card' }, [
            el('h3', { text: s.title }),
            el('p', { text: s.blurb }),
            el('p', { class: 'story-meta', text: s.questions.length + ' questions · about ' + content.minutes(s) + ' min to read' }),
            el('p', {}, [el('span', { class: 'badge badge-outline', text: badge })]),
            actions
        ])]);
    }

    /* ---------- reader ---------- */

    function initReader(story) {
        var attempt = engine.startAttempt(studentId, story);
        if (!attempt) {
            show('missing-view');
            byId('missing-title').textContent = 'Could not start';
            return;
        }
        show('reader-view');
        document.title = story.title + ' | ReadWell';

        var total = story.questions.length;
        var index = Math.min(Math.max(attempt.currentIndex || 0, 0), total - 1);
        var retrying = false;   // true after Try Again, until the next submit

        byId('reader-title').textContent = story.title;
        byId('reader-sub').textContent = content.levelLabel(story.level) + ' story · ' + total + ' questions';
        byId('progress-mode').textContent = attempt.mode === 'practice' ? 'Practice attempt' : 'Original attempt';

        var rate = function () { return RW.settings.speechRate(studentId); };
        RW.tts.mount(byId('tts-story'), {
            label: 'Listen to the story',
            getText: function () { return story.paragraphs.join(' '); },
            getRate: rate
        });
        var ttsQuestion = RW.tts.mount(byId('tts-question'), {
            label: 'Listen to the question',
            getText: function () {
                var q = story.questions[index];
                return q.questionText + ' ' + q.choices.map(function (c, i) {
                    return 'Choice ' + (i + 1) + '. ' + c;
                }).join(' ');
            },
            getRate: rate
        });

        var form = byId('question-form');
        var hintButton = byId('hint-button');
        var submitButton = byId('submit-button');
        var retryButton = byId('retry-button');
        var explainButton = byId('explain-button');
        var nextButton = byId('next-button');

        function save() { return store.saveAttempt(attempt); }

        byId('bookmark-slot').appendChild(bookmarkButton(story, true));
        initTimer(attempt, save);

        function currentQuestion() { return story.questions[index]; }

        function selectedAnswer() {
            var checked = form.querySelector('input[name="answer"]:checked');
            return checked ? checked.value : '';
        }

        function setLocked(locked) {
            var inputs = form.querySelectorAll('input[name="answer"]');
            for (var i = 0; i < inputs.length; i++) {
                inputs[i].disabled = locked;
                inputs[i].parentNode.classList.toggle('is-locked', locked);
            }
        }

        function showError(message) {
            var box = byId('question-error');
            box.textContent = message || '';
            box.hidden = !message;
        }

        function renderHints(q, a) {
            var list = byId('hint-list');
            ui.clear(list);
            for (var n = 1; n <= a.hintsUsed; n++) {
                list.appendChild(el('li', {}, [el('strong', { text: 'Hint ' + n + ': ' }), engine.hintText(q, n)]));
            }
            var out = a.hintsUsed >= engine.MAX_HINTS;
            hintButton.textContent = out ? 'No more hints' : 'Show hint ' + (a.hintsUsed + 1) + ' of ' + engine.MAX_HINTS;
            hintButton.disabled = out;
            hintButton.hidden = a.solved;
        }

        function showFeedback(q, correct) {
            var f = engine.feedbackFor(q, correct);
            var box = byId('feedback');
            box.className = 'feedback ' + (correct ? 'is-correct' : 'is-wrong');
            byId('feedback-title').textContent = f.title;
            byId('feedback-body').textContent = f.body;
            box.hidden = false;
        }

        function fillExplanation(q) {
            byId('explain-answer').textContent = q.correctAnswer;
            byId('explain-why').textContent = q.explanation;
            byId('explain-evidence').textContent = content.evidenceParts(q.evidence).join(' … ');
        }

        function setExplanationOpen(open) {
            byId('explanation').hidden = !open;
            explainButton.setAttribute('aria-expanded', open ? 'true' : 'false');
            explainButton.textContent = open ? 'Hide Explanation' : 'Show Explanation';
        }

        function renderQuestion(moveFocus) {
            var q = currentQuestion();
            var a = engine.answerFor(attempt, q.questionId);
            retrying = false;
            if (RW.aiFeedback) { RW.aiFeedback.hide(); }
            ttsQuestion.stop();

            byId('progress-text').textContent = 'Question ' + (index + 1) + ' of ' + total;
            var done = story.questions.filter(function (x) {
                var r = engine.findAnswer(attempt, x.questionId);
                return r && r.submitted;
            }).length;
            byId('progress-fill').style.width = Math.round((done / total) * 100) + '%';
            var bar = byId('progress-bar');
            bar.setAttribute('aria-valuemax', String(total));
            bar.setAttribute('aria-valuenow', String(done));
            bar.setAttribute('aria-valuetext', done + ' of ' + total + ' questions finished');

            byId('question-text').textContent = q.questionText;

            var list = byId('answer-list');
            ui.clear(list);
            q.choices.forEach(function (choice, i) {
                var input = el('input', { type: 'radio', name: 'answer', value: choice, id: 'choice-' + i });
                if (a.submitted && a.lastAnswer === choice) { input.checked = true; }
                list.appendChild(el('li', {}, [el('label', { class: 'answer', for: 'choice-' + i }, [input, el('span', { text: choice })])]));
            });

            showError('');
            renderHints(q, a);
            fillExplanation(q);
            setExplanationOpen(false);
            nextButton.textContent = index === total - 1 ? 'See results' : 'Next question';

            if (a.submitted) {
                // Coming back to a question that was already answered.
                setLocked(true);
                showFeedback(q, a.solved);
                submitButton.hidden = true;
                retryButton.hidden = a.solved;
                explainButton.hidden = false;
                nextButton.hidden = false;
            } else {
                setLocked(false);
                byId('feedback').hidden = true;
                submitButton.hidden = false;
                retryButton.hidden = true;
                explainButton.hidden = true;
                nextButton.hidden = true;
            }

            if (moveFocus) {
                var legend = byId('question-text');
                legend.setAttribute('tabindex', '-1');
                legend.focus();
                byId('question-label').scrollIntoView({ block: 'start' });
            }
        }

        hintButton.addEventListener('click', function () {
            var q = currentQuestion();
            engine.useHint(attempt, q);
            save();
            renderHints(q, engine.answerFor(attempt, q.questionId));
            var items = byId('hint-list').children;
            if (items.length) {
                var last = items[items.length - 1];
                last.setAttribute('tabindex', '-1');
                last.focus();
            }
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = currentQuestion();
            var result = engine.submitAnswer(attempt, q, selectedAnswer());
            if (!result.ok) {
                showError(result.error);
                var first = form.querySelector('input[name="answer"]');
                if (first && !selectedAnswer()) { first.focus(); }
                return;
            }
            showError('');
            if (!save()) { showError('Your answer could not be saved. Check that this browser allows site data.'); }
            retrying = false;
            setLocked(true);
            showFeedback(q, result.correct);
            if (RW.aiFeedback) { RW.aiFeedback.ask(q, selectedAnswer(), engine.answerFor(attempt, q.questionId).tries); }
            submitButton.hidden = true;
            retryButton.hidden = result.correct;
            explainButton.hidden = false;
            nextButton.hidden = false;
            renderHints(q, engine.answerFor(attempt, q.questionId));
            var box = byId('feedback');
            box.setAttribute('tabindex', '-1');
            box.focus();
        });

        retryButton.addEventListener('click', function () {
            retrying = true;
            setLocked(false);
            var inputs = form.querySelectorAll('input[name="answer"]');
            for (var i = 0; i < inputs.length; i++) { inputs[i].checked = false; }
            byId('feedback').hidden = true;
            if (RW.aiFeedback) { RW.aiFeedback.hide(); }
            setExplanationOpen(false);
            submitButton.hidden = false;
            retryButton.hidden = true;
            if (inputs.length) { inputs[0].focus(); }
        });

        explainButton.addEventListener('click', function () {
            setExplanationOpen(byId('explanation').hidden);
        });

        nextButton.addEventListener('click', function () {
            if (index < total - 1) {
                index += 1;
                attempt.currentIndex = index;
                save();
                renderQuestion(true);
                return;
            }
            if (engine.finishAttempt(attempt, story) && save()) {
                window.location.href = 'results.html?attempt=' + encodeURIComponent(attempt.attemptId);
            } else {
                showError('Answer every question before you finish.');
            }
        });

        renderQuestion(false);
        initAnnotations(story);
    }

    /* ---------- optional reading timer ----------
       It only counts up. It never ends the activity, never locks a question
       and has no effect on the score. It pauses while the tab is hidden. */

    function initTimer(attempt, save) {
        var row = byId('timer-row');
        var text = byId('timer-text');
        var toggle = byId('timer-toggle');
        var seconds = attempt.readingSeconds || 0;
        var visible = RW.settings.get(studentId).timer === 'on';

        function clock(total) {
            var m = Math.floor(total / 60), s = total % 60;
            return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
        }
        function paint() {
            row.hidden = false;
            text.hidden = !visible;
            text.textContent = 'Reading time: ' + clock(seconds);
            toggle.textContent = visible ? 'Hide timer' : 'Show timer';
            toggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
        }
        toggle.addEventListener('click', function () {
            visible = !visible;
            RW.settings.set(studentId, { timer: visible ? 'on' : 'off' });
            paint();
        });

        // Time is only counted while the timer is turned on.
        window.setInterval(function () {
            if (!visible || document.hidden || attempt.status === 'completed') { return; }
            seconds += 1;
            attempt.readingSeconds = seconds;
            text.textContent = 'Reading time: ' + clock(seconds);
            if (seconds % 15 === 0) { save(); }
        }, 1000);
        window.addEventListener('pagehide', function () { attempt.readingSeconds = seconds; save(); });
        paint();
    }

    /* ---------- highlights and notes ---------- */

    function initAnnotations(story) {
        var passage = byId('passage');
        var status = byId('annotate-status');
        var data = store.getAnnotations(studentId, story.storyId);
        data.highlights = ann.valid(data.highlights, story.paragraphs);
        var editingId = null;
        var lastSel = null;   // { p, start, end, time } from the most recent text selection

        function persist() {
            return store.saveAnnotations(studentId, story.storyId, data);
        }

        function say(message) { status.textContent = message; }

        function findHighlight(id) {
            for (var i = 0; i < data.highlights.length; i++) {
                if (data.highlights[i].id === id) { return data.highlights[i]; }
            }
            return null;
        }

        function renderPassage() {
            ui.clear(passage);
            story.paragraphs.forEach(function (text, p) {
                var para = el('p', { 'data-p': String(p) });
                ann.segments(text, data.highlights, p).forEach(function (seg) {
                    if (!seg.highlight) {
                        para.appendChild(document.createTextNode(seg.text));
                        return;
                    }
                    var h = seg.highlight;
                    var mark = el('mark', {
                        class: 'hl' + (h.note ? ' has-note' : ''),
                        tabindex: '0', role: 'button', 'data-id': h.id,
                        'aria-label': 'Highlighted: ' + h.text + (h.note ? '. Has a note.' : '.') + ' Press Enter to ' + (h.note ? 'edit' : 'add') + ' a note.'
                    });
                    mark.textContent = seg.text;
                    para.appendChild(mark);
                });
                passage.appendChild(para);
            });
        }

        function renderNotes() {
            var list = byId('notes-list');
            ui.clear(list);
            var sorted = data.highlights.slice().sort(function (a, b) { return a.p - b.p || a.start - b.start; });
            byId('notes-empty').hidden = sorted.length > 0;
            byId('clear-highlights').disabled = sorted.length === 0;

            sorted.forEach(function (h) {
                var item = el('li', { class: 'note-item', 'data-id': h.id });
                item.appendChild(el('blockquote', { class: 'quote', text: h.text }));

                if (editingId === h.id) {
                    var field = el('div', { class: 'form-field' }, [
                        el('label', { for: 'note-input-' + h.id, text: 'Your note' }),
                        el('textarea', { id: 'note-input-' + h.id, maxlength: '500' })
                    ]);
                    field.querySelector('textarea').value = h.note;
                    var row = el('div', { class: 'button-row' });
                    var saveBtn = el('button', { type: 'button', class: 'btn btn-primary btn-sm', text: 'Save note' });
                    var cancelBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Cancel' });
                    saveBtn.addEventListener('click', function () {
                        data.highlights = ann.setNote(data.highlights, h.id, field.querySelector('textarea').value.trim());
                        persist();
                        editingId = null;
                        renderPassage(); renderNotes();
                        say(field.querySelector('textarea').value.trim() ? 'Note saved.' : 'Note removed.');
                        focusInItem(h.id, '[data-act="edit"]');
                    });
                    cancelBtn.addEventListener('click', function () {
                        editingId = null; renderNotes(); focusInItem(h.id, '[data-act="edit"]');
                    });
                    row.appendChild(saveBtn);
                    row.appendChild(cancelBtn);
                    if (h.note) {
                        var del = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Delete note' });
                        del.addEventListener('click', function () {
                            data.highlights = ann.setNote(data.highlights, h.id, '');
                            persist();
                            editingId = null;
                            renderPassage(); renderNotes();
                            say('Note deleted.');
                            focusInItem(h.id, '[data-act="edit"]');
                        });
                        row.appendChild(del);
                    }
                    item.appendChild(field);
                    item.appendChild(row);
                } else {
                    item.appendChild(el('p', { class: 'note-text', text: h.note || 'No note yet.' }));
                    var actions = el('div', { class: 'button-row' });
                    var edit = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-act': 'edit', text: h.note ? 'Edit note' : 'Add note' });
                    var remove = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', text: 'Remove highlight' });
                    edit.addEventListener('click', function () { openEditor(h.id); });
                    remove.addEventListener('click', function () {
                        data.highlights = ann.removeHighlight(data.highlights, h.id);
                        persist();
                        editingId = null;
                        renderPassage(); renderNotes();
                        say('Highlight removed.');
                    });
                    actions.appendChild(edit);
                    actions.appendChild(remove);
                    item.appendChild(actions);
                }
                list.appendChild(item);
            });
        }

        function focusInItem(id, selector) {
            var item = byId('notes-list').querySelector('[data-id="' + id + '"]');
            var target = item && item.querySelector(selector);
            if (target) { target.focus(); }
        }

        function openEditor(id) {
            editingId = id;
            renderNotes();
            var item = byId('notes-list').querySelector('[data-id="' + id + '"]');
            if (item) {
                item.classList.add('is-flash');
                var area = item.querySelector('textarea');
                if (area) { area.focus(); }
                item.scrollIntoView({ block: 'nearest' });
            }
        }

        /* ----- selection ----- */

        function paragraphOf(node) {
            var n = node && node.nodeType === 3 ? node.parentNode : node;
            while (n && n !== passage) {
                if (n.nodeType === 1 && n.hasAttribute('data-p')) { return n; }
                n = n.parentNode;
            }
            return null;
        }

        function offsetIn(para, node, offset) {
            var r = document.createRange();
            r.setStart(para, 0);
            r.setEnd(node, offset);
            return r.toString().length;
        }

        /* Turns the current browser selection into { p, start, end }, or a reason it cannot. */
        function readSelection() {
            var sel = window.getSelection();
            if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { return null; }
            var range = sel.getRangeAt(0);
            if (!passage.contains(range.commonAncestorContainer)) { return null; }
            var startP = paragraphOf(range.startContainer);
            var endP = paragraphOf(range.endContainer);
            if (!startP || !endP) { return null; }
            var p = parseInt(startP.getAttribute('data-p'), 10);
            var start = offsetIn(startP, range.startContainer, range.startOffset);
            var end;
            if (endP === startP) {
                end = offsetIn(startP, range.endContainer, range.endOffset);
            } else if (parseInt(endP.getAttribute('data-p'), 10) === p + 1 && offsetIn(endP, range.endContainer, range.endOffset) === 0) {
                end = startP.textContent.length;   // a triple-click selects to the start of the next paragraph
            } else {
                return { crossing: true };
            }
            return { p: p, start: start, end: end, time: Date.now() };
        }

        document.addEventListener('selectionchange', function () {
            var s = readSelection();
            if (s && !s.crossing) { lastSel = s; }
        });

        var highlightButton = byId('highlight-button');
        // Keep the text selected while the button is pressed.
        highlightButton.addEventListener('mousedown', function (e) { e.preventDefault(); });

        highlightButton.addEventListener('click', function () {
            var current = readSelection();
            if (current && current.crossing) {
                say('Please select words inside one paragraph at a time.');
                return;
            }
            var chosen = current || (lastSel && Date.now() - lastSel.time < 20000 ? lastSel : null);
            if (!chosen) {
                say('Select some words in the story first, then press Highlight selection.');
                return;
            }
            addAndSay(chosen.p, chosen.start, chosen.end);
        });

        function addAndSay(p, start, end) {
            var res = ann.addHighlight(data.highlights, story.paragraphs, p, start, end);
            if (!res.ok) { say(res.error); return; }
            data.highlights = res.highlights;
            if (!persist()) { say('Your highlight could not be saved. Check that this browser allows site data.'); }
            lastSel = null;
            var sel = window.getSelection();
            if (sel) { sel.removeAllRanges(); }
            renderPassage(); renderNotes();
            say('Highlighted. Press the highlight to add a note.');
        }

        byId('highlight-paragraph').addEventListener('click', function () {
            var p = parseInt(byId('paragraph-select').value, 10);
            addAndSay(p, 0, story.paragraphs[p].length);
        });

        byId('clear-highlights').addEventListener('click', function () {
            if (!data.highlights.length) { return; }
            if (!window.confirm('Remove all highlights and their notes from this story?')) { return; }
            data.highlights = [];
            persist();
            editingId = null;
            renderPassage(); renderNotes();
            say('All highlights removed.');
        });

        passage.addEventListener('click', function (e) {
            var mark = e.target.closest ? e.target.closest('mark.hl') : null;
            if (mark && window.getSelection().isCollapsed) { openEditor(mark.getAttribute('data-id')); }
        });
        passage.addEventListener('keydown', function (e) {
            var mark = e.target.closest ? e.target.closest('mark.hl') : null;
            if (mark && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openEditor(mark.getAttribute('data-id'));
            }
        });

        /* ----- note about the whole story ----- */
        var storyNote = byId('story-note');
        storyNote.value = data.storyNote;
        byId('save-story-note').addEventListener('click', function () {
            data.storyNote = storyNote.value.trim().slice(0, 500);
            storyNote.value = data.storyNote;
            persist();
            say(data.storyNote ? 'Story note saved.' : 'Story note is empty.');
        });
        byId('delete-story-note').addEventListener('click', function () {
            data.storyNote = '';
            storyNote.value = '';
            persist();
            say('Story note deleted.');
        });

        /* ----- paragraph picker ----- */
        var select = byId('paragraph-select');
        story.paragraphs.forEach(function (text, i) {
            var preview = text.split(' ').slice(0, 5).join(' ') + '...';
            select.appendChild(el('option', { value: String(i), text: (i + 1) + ': ' + preview }));
        });

        renderPassage();
        renderNotes();
    }
})();
