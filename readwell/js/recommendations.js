/* =========================================================
   ReadWell — recommendations (simple rules, no AI)
   Score rule, from the score on a finished attempt:
     below 60%   -> another Beginner activity (one that includes the
                    skill that was hardest in that attempt, when possible)
     60% to 79%  -> another activity at the same level
     80% or more -> a more challenging activity (Advanced stays Advanced)
   Skill rule: the skill with the lowest accuracy (at least 2 questions,
   below 70%) gets a suggested activity that includes that skill.
   Words stay encouraging; nothing here labels or diagnoses a child.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};
    var LEVEL_ORDER = ['beginner', 'intermediate', 'advanced'];

    /* "a Beginner" / "an Intermediate" / "an Advanced" */
    function article(word) {
        return /^[aeiou]/i.test(word) ? 'an' : 'a';
    }

    function nextLevel(level) {
        var i = LEVEL_ORDER.indexOf(level);
        return LEVEL_ORDER[Math.min(i + 1, LEVEL_ORDER.length - 1)];
    }

    function doneCounts(studentId) {
        var counts = {};
        RW.progress.completedAttempts(studentId).forEach(function (a) {
            counts[a.storyId] = (counts[a.storyId] || 0) + 1;
        });
        return counts;
    }

    function skillQuestionCount(story, skill) {
        return story.questions.filter(function (q) { return q.skill === skill; }).length;
    }

    /* Picks the best story from candidates: not finished first, then has the
       wanted skill, then fewer finished attempts, then the list order. */
    function pick(candidates, counts, skill) {
        var best = null, bestScore = null;
        candidates.forEach(function (s, index) {
            var score = [
                counts[s.storyId] ? 1 : 0,
                skill && skillQuestionCount(s, skill) > 0 ? 0 : 1,
                counts[s.storyId] || 0,
                skill ? -skillQuestionCount(s, skill) : 0,
                index
            ];
            if (!bestScore || compare(score, bestScore) < 0) { best = s; bestScore = score; }
        });
        return best;
    }

    function compare(a, b) {
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) { return a[i] - b[i]; }
        }
        return 0;
    }

    function weakestSkillOf(attempt) {
        var worst = null;
        attempt.summary.skills.forEach(function (s) {
            var p = RW.questions.percent(s.correct, s.total);
            if (p < 100 && (!worst || p < worst.p)) { worst = { skill: s.skill, p: p }; }
        });
        return worst ? worst.skill : null;
    }

    /* Recommendation after one finished attempt. Returns null if nothing fits. */
    function afterAttempt(studentId, attempt) {
        if (!attempt || !attempt.summary) { return null; }
        var pct = attempt.summary.percent;
        var counts = doneCounts(studentId);
        var level, skill = null, text;

        if (pct < 60) {
            level = 'beginner';
            skill = weakestSkillOf(attempt);
            text = 'Try another Beginner activity' + (skill ? ' to practice ' + skill : '') + '.';
        } else if (pct < 80) {
            level = attempt.difficulty;
            text = 'Try another ' + RW.content.levelLabel(level) + ' activity to keep building your skills.';
        } else {
            level = nextLevel(attempt.difficulty);
            text = level === attempt.difficulty
                ? 'Great work! Try another Advanced activity.'
                : 'Great work! You may be ready for ' + article(RW.content.levelLabel(level)) + ' ' + RW.content.levelLabel(level) + ' activity.';
        }

        var candidates = RW.content.getStories(level).filter(function (s) { return s.storyId !== attempt.storyId; });
        if (!candidates.length) { candidates = RW.content.getStories(level); }
        var story = pick(candidates, counts, skill);
        return story ? { story: story, text: text, skill: skill } : null;
    }

    /* "You may want to practice: Inference. Recommended activity: ..." */
    function forSkill(studentId) {
        var st = RW.progress.stats(studentId);
        if (!st.needsPractice.length) { return null; }
        var skill = st.needsPractice[0].skill;
        var counts = doneCounts(studentId);
        var stories = RW.content.getStories().filter(function (s) { return skillQuestionCount(s, skill) > 0; });
        // Prefer the lowest level that still has something new to read.
        var chosen = null;
        LEVEL_ORDER.forEach(function (lv) {
            if (chosen) { return; }
            var fresh = stories.filter(function (s) { return s.level === lv && !counts[s.storyId]; });
            if (fresh.length) { chosen = pick(fresh, counts, skill); }
        });
        if (!chosen) { chosen = pick(stories, counts, skill); }
        return chosen ? { skill: skill, story: chosen } : null;
    }

    /* The suggestion shown on the student's home page. */
    function forHome(studentId) {
        var attempts = RW.progress.completedAttempts(studentId);
        if (!attempts.length) {
            var first = RW.content.getStories('beginner')[0];
            return first ? { story: first, text: 'A good place to start is a Beginner story.', skill: null } : null;
        }
        return afterAttempt(studentId, attempts[attempts.length - 1]);
    }

    RW.recommendations = {
        afterAttempt: afterAttempt,
        forSkill: forSkill,
        forHome: forHome,
        nextLevel: nextLevel
    };
})(window);
