/* =========================================================
   ReadWell — reading engine (all rules, no AI)
   Starting attempts, checking answers, counting hints, calculating
   scores and skill totals. Everything is plain if/else and counting.

   Scoring rule (kept simple and shown to students on the results page):
     A question counts as CORRECT when the FIRST answer submitted for it
     is right. Try Again lets a student keep learning from a question,
     but it does not change the recorded first answer or the score.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var store = RW.store;

    var MAX_HINTS = 3;

    var MSG = {
        correctTitle: '✓ Correct!',
        correctBody: 'Your answer is supported by the passage.',
        wrongTitle: '✕ Not quite.',
        wrongLead: 'Look back at the passage and review the information about '
    };

    function now() { return new Date().toISOString(); }

    function blankAnswer(questionId) {
        return {
            questionId: questionId,
            hintsUsed: 0,
            submitted: false,
            firstAnswer: null,
            firstCorrect: false,
            tries: 0,
            lastAnswer: null,
            solved: false
        };
    }

    /* The answer record for one question, creating it if needed. */
    function answerFor(attempt, questionId) {
        for (var i = 0; i < attempt.answers.length; i++) {
            if (attempt.answers[i].questionId === questionId) { return attempt.answers[i]; }
        }
        var fresh = blankAnswer(questionId);
        attempt.answers.push(fresh);
        return fresh;
    }

    function findAnswer(attempt, questionId) {
        for (var i = 0; i < attempt.answers.length; i++) {
            if (attempt.answers[i].questionId === questionId) { return attempt.answers[i]; }
        }
        return null;
    }

    /* ---------- starting an attempt ---------- */

    /* Rules:
       - An unfinished attempt for this student + story is resumed.
       - If the student has never finished the story, a new ORIGINAL attempt starts.
       - If they have finished it before, a new PRACTICE attempt starts and points
         at the first finished attempt. Earlier attempts are never changed. */
    function startAttempt(studentId, story) {
        var mine = store.getAttemptsByStudent(studentId).filter(function (a) {
            return a.storyId === story.storyId;
        });

        var open = null;
        mine.forEach(function (a) { if (a.status === 'in_progress') { open = a; } });
        if (open) { return open; }

        var firstDone = null;
        mine.forEach(function (a) {
            if (a.status === 'completed' && !firstDone) { firstDone = a; }
        });

        var attempt = store.addAttempt({
            studentId: studentId,
            storyId: story.storyId,
            difficulty: story.level,
            mode: firstDone ? 'practice' : 'original',
            baseAttemptId: firstDone ? firstDone.attemptId : null,
            status: 'in_progress',
            currentIndex: 0,
            answers: [],
            summary: null,
            startedAt: now(),
            completedAt: null
        });
        if (!attempt) { return null; }

        var activity = store.getActivities(studentId).filter(function (a) { return a.storyId === story.storyId; })[0];
        store.upsertActivity(studentId, story, {
            difficulty: story.level,
            status: activity && activity.status === 'completed' ? 'completed' : 'in_progress',
            attemptCount: (activity ? activity.attemptCount : 0) + 1,
            lastAttemptAt: now()
        });
        return attempt;
    }

    /* ---------- hints ---------- */

    /* Reveals the next hint (1, 2 then 3). Returns the new hint count. */
    function useHint(attempt, question) {
        var a = answerFor(attempt, question.questionId);
        if (a.solved || a.hintsUsed >= MAX_HINTS) { return a.hintsUsed; }
        a.hintsUsed += 1;
        return a.hintsUsed;
    }

    function hintText(question, level) {
        return question['hint' + level];
    }

    /* ---------- checking answers ---------- */

    /* Returns { ok:boolean, error?:string, correct:boolean, message... }.
       Rejects an empty answer, an answer that is not one of the choices,
       and a question that is already solved. */
    function submitAnswer(attempt, question, selected) {
        if (typeof selected !== 'string' || selected === '') {
            return { ok: false, error: 'Choose an answer first.' };
        }
        if (question.choices.indexOf(selected) < 0) {
            return { ok: false, error: 'That answer is not one of the choices.' };
        }
        var a = answerFor(attempt, question.questionId);
        if (a.solved) {
            return { ok: false, error: 'This question is already answered correctly.' };
        }

        var correct = selected === question.correctAnswer;
        a.tries += 1;
        a.lastAnswer = selected;
        if (!a.submitted) {
            a.submitted = true;
            a.firstAnswer = selected;
            a.firstCorrect = correct;
        }
        if (correct) { a.solved = true; }

        return { ok: true, correct: correct, feedback: feedbackFor(question, correct) };
    }

    function feedbackFor(question, correct) {
        if (correct) {
            return { title: MSG.correctTitle, body: MSG.correctBody };
        }
        return { title: MSG.wrongTitle, body: MSG.wrongLead + question.reviewTopic + '.' };
    }

    /* ---------- summaries ---------- */

    function percent(correct, total) {
        return total > 0 ? Math.round((correct / total) * 100) : 0;
    }

    /* Everything the results page shows, calculated from the attempt. */
    function summarize(attempt, story) {
        var total = story.questions.length;
        var correct = 0, incorrect = 0, hints = 0, answered = 0;
        var skills = {}, order = [];

        story.questions.forEach(function (q) {
            var a = findAnswer(attempt, q.questionId);
            var isCorrect = !!(a && a.submitted && a.firstCorrect);
            var isWrong = !!(a && a.submitted && !a.firstCorrect);
            if (a && a.submitted) { answered += 1; }
            if (isCorrect) { correct += 1; }
            if (isWrong) { incorrect += 1; }
            if (a) { hints += a.hintsUsed; }

            if (!skills[q.skill]) {
                skills[q.skill] = { skill: q.skill, categories: [], correct: 0, total: 0 };
                order.push(q.skill);
            }
            var entry = skills[q.skill];
            entry.total += 1;
            if (isCorrect) { entry.correct += 1; }
            if (entry.categories.indexOf(q.category) < 0) { entry.categories.push(q.category); }
        });

        return {
            total: total,
            answered: answered,
            correct: correct,
            incorrect: incorrect,
            hintsUsed: hints,
            percent: percent(correct, total),
            skills: order.map(function (name) { return skills[name]; })
        };
    }

    /* A finished attempt needs every question answered once. */
    function canFinish(attempt, story) {
        return story.questions.every(function (q) {
            var a = findAnswer(attempt, q.questionId);
            return a && a.submitted;
        });
    }

    function finishAttempt(attempt, story) {
        if (!canFinish(attempt, story)) { return false; }
        attempt.status = 'completed';
        attempt.completedAt = now();
        attempt.summary = summarize(attempt, story);
        store.upsertActivity(attempt.studentId, story, {
            status: 'completed',
            lastAttemptAt: attempt.completedAt,
            completedAt: attempt.completedAt
        });
        return true;
    }

    /* How a practice attempt compares to the original. */
    function compare(original, practice) {
        var diff = practice.summary.percent - original.summary.percent;
        return {
            original: original.summary.percent,
            practice: practice.summary.percent,
            difference: diff,
            text: diff > 0 ? 'You improved by ' + diff + '%.'
                : diff < 0 ? 'This practice score is ' + Math.abs(diff) + '% lower. Review the explanations and try again when you are ready.'
                    : 'Your practice score matches your original score.'
        };
    }

    /* The status shown on a story card in the library. */
    function storyStatus(studentId, story) {
        var mine = store.getAttemptsByStudent(studentId).filter(function (a) { return a.storyId === story.storyId; });
        var open = null, firstDone = null, last = null;
        mine.forEach(function (a) {
            if (a.status === 'in_progress') { open = a; }
            if (a.status === 'completed') {
                if (!firstDone) { firstDone = a; }
                last = a;
            }
        });
        return { open: open, original: firstDone, latest: last, count: mine.length };
    }

    RW.questions = {
        MAX_HINTS: MAX_HINTS,
        MSG: MSG,
        answerFor: answerFor,
        findAnswer: findAnswer,
        startAttempt: startAttempt,
        useHint: useHint,
        hintText: hintText,
        submitAnswer: submitAnswer,
        feedbackFor: feedbackFor,
        summarize: summarize,
        canFinish: canFinish,
        finishAttempt: finishAttempt,
        compare: compare,
        percent: percent,
        storyStatus: storyStatus
    };
})(window);
