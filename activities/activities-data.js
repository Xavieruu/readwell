/* =========================================================
   ReadWell — activities (stories + their questions)
   Joins passages-data.js and questions-data.js into reading
   activities and offers simple lookups to the rest of the site.
   Load this file AFTER passages-data.js and questions-data.js.

   An activity (called a "story" in the code) looks like:
     storyId, title, level (beginner | intermediate | advanced),
     blurb (short description), paragraphs, wordCount,
     readingMinutes, categories, skills, questions[]
   There is NO AI here: nothing is generated, it only joins lists.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var data = RW.data || {};

    var LEVELS = [
        { key: 'beginner', label: 'Beginner', blurb: 'Short stories with simple sentences.' },
        { key: 'intermediate', label: 'Intermediate', blurb: 'Longer stories with more detail.' },
        { key: 'advanced', label: 'Advanced', blurb: 'Rich stories that ask you to think harder.' }
    ];

    var CATEGORIES = ['Literal', 'Reorganization', 'Inferential', 'Evaluation', 'Appreciation'];

    var SKILL_NAMES = ['Main Idea', 'Supporting Details', 'Sequencing', 'Cause and Effect',
        'Organizing Information', 'Inference', 'Evidence-Based Reasoning',
        'Vocabulary in Context', "Author's Purpose", 'Critical Evaluation', 'Tone', 'Mood'];

    function countWords(paragraphs) {
        return paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    }

    function unique(list) {
        return list.filter(function (item, i) { return list.indexOf(item) === i; });
    }

    /* Build the list of activities once, when the page loads. */
    var stories = (data.passages || []).map(function (p) {
        var questions = (data.questions || []).filter(function (q) {
            return q.passageId === p.passageId;
        });
        var words = countWords(p.paragraphs);
        return {
            storyId: p.passageId,
            title: p.title,
            level: p.level,
            blurb: p.description,
            paragraphs: p.paragraphs,
            wordCount: words,
            readingMinutes: Math.max(1, Math.ceil(words / 100)),
            categories: unique(questions.map(function (q) { return q.category; })),
            skills: unique(questions.map(function (q) { return q.skill; })),
            questions: questions
        };
    });

    /* ---------- lookups ---------- */

    function getStories(level) {
        return stories.filter(function (s) { return !level || s.level === level; });
    }

    function getStory(id) {
        for (var i = 0; i < stories.length; i++) {
            if (stories[i].storyId === id) { return stories[i]; }
        }
        return null;
    }

    function getQuestion(story, questionId) {
        for (var i = 0; i < story.questions.length; i++) {
            if (story.questions[i].questionId === questionId) { return story.questions[i]; }
        }
        return null;
    }

    function levelLabel(key) {
        for (var i = 0; i < LEVELS.length; i++) {
            if (LEVELS[i].key === key) { return LEVELS[i].label; }
        }
        return key;
    }

    function isLevel(key) {
        return LEVELS.some(function (l) { return l.key === key; });
    }

    /* Minutes to read, rounded up, at about 100 words a minute. */
    function minutes(story) {
        return story.readingMinutes || Math.max(1, Math.ceil(story.wordCount / 100));
    }

    /* "quote one | quote two" -> ["quote one", "quote two"] */
    function evidenceParts(evidence) {
        return String(evidence).split(' | ');
    }

    RW.content = {
        LEVELS: LEVELS,
        CATEGORIES: CATEGORIES,
        SKILL_NAMES: SKILL_NAMES,
        getStories: getStories,
        getStory: getStory,
        getQuestion: getQuestion,
        levelLabel: levelLabel,
        isLevel: isLevel,
        minutes: minutes,
        evidenceParts: evidenceParts
    };
})(window);
