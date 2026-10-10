/* =========================================================
   ReadWell — progress calculations (rules and counting only, no AI)
   Every function takes a studentId and only reads that student's
   attempts, so one child's numbers are never mixed with another's.

   Words used in the app:
     "Doing well"          skill accuracy 80% or higher
     "Could use practice"  skill accuracy below 70%
   Both need at least 2 answered questions in the skill, so one
   missed question never labels a skill. These are friendly study
   hints, not tests or diagnoses.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    var STRONG_FROM = 80;
    var PRACTICE_BELOW = 70;
    var MIN_QUESTIONS = 2;

    /* Finished attempts of known stories, oldest first. */
    function completedAttempts(studentId) {
        return RW.store.getAttemptsByStudent(studentId)
            .filter(function (a) {
                return a.status === 'completed' && a.completedAt && a.summary && RW.content.getStory(a.storyId);
            })
            .sort(function (a, b) { return a.completedAt < b.completedAt ? -1 : a.completedAt > b.completedAt ? 1 : 0; });
    }

    function dayKey(iso) {
        var d = new Date(iso);
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /* Accuracy per skill over all finished attempts. */
    function skillTotals(attempts) {
        var map = {}, order = [];
        attempts.forEach(function (a) {
            a.summary.skills.forEach(function (s) {
                if (!map[s.skill]) {
                    map[s.skill] = { skill: s.skill, category: s.categories[0], correct: 0, total: 0 };
                    order.push(s.skill);
                }
                map[s.skill].correct += s.correct;
                map[s.skill].total += s.total;
            });
        });
        return order.map(function (name) {
            var e = map[name];
            e.percent = RW.questions.percent(e.correct, e.total);
            return e;
        }).sort(function (a, b) { return b.percent - a.percent || a.skill.localeCompare(b.skill); });
    }

    /* For each practice attempt: how it compares to its original. */
    function improvements(attempts) {
        var out = [];
        attempts.forEach(function (a) {
            if (a.mode !== 'practice') { return; }
            var base = null;
            attempts.forEach(function (b) { if (b.attemptId === a.baseAttemptId) { base = b; } });
            if (!base) { return; }
            var story = RW.content.getStory(a.storyId);
            out.push({
                storyId: a.storyId,
                title: story.title,
                originalPercent: base.summary.percent,
                practicePercent: a.summary.percent,
                difference: a.summary.percent - base.summary.percent,
                date: a.completedAt,
                attemptId: a.attemptId
            });
        });
        return out;
    }

    function stats(studentId) {
        var attempts = completedAttempts(studentId);
        var stories = {};
        attempts.forEach(function (a) { stories[a.storyId] = true; });

        var sum = 0, best = 0;
        attempts.forEach(function (a) {
            sum += a.summary.percent;
            if (a.summary.percent > best) { best = a.summary.percent; }
        });

        var skills = skillTotals(attempts);
        var eligible = skills.filter(function (s) { return s.total >= MIN_QUESTIONS; });
        var improved = improvements(attempts);
        var gain = 0;
        improved.forEach(function (i) { gain += i.difference; });

        return {
            hasData: attempts.length > 0,
            activitiesCompleted: Object.keys(stories).length,
            attemptsCompleted: attempts.length,
            attemptsStarted: RW.store.getAttemptsByStudent(studentId).length,
            average: attempts.length ? Math.round(sum / attempts.length) : 0,
            best: best,
            recent: attempts.slice().reverse().slice(0, 5),
            timeline: attempts.map(function (a) {
                return { attemptId: a.attemptId, title: RW.content.getStory(a.storyId).title,
                    percent: a.summary.percent, date: a.completedAt, mode: a.mode };
            }),
            skills: skills,
            strengths: eligible.filter(function (s) { return s.percent >= STRONG_FROM; }),
            needsPractice: eligible.filter(function (s) { return s.percent < PRACTICE_BELOW; })
                .sort(function (a, b) { return a.percent - b.percent; }),
            improvements: improved,
            averageImprovement: improved.length ? Math.round(gain / improved.length) : 0,
            lastCompletedAt: attempts.length ? attempts[attempts.length - 1].completedAt : null
        };
    }

    /* A neutral sentence for parents, e.g. "Alex has recently practiced ...". */
    function summarySentence(name, studentId) {
        var s = stats(studentId);
        if (!s.hasData) { return name + ' has not finished a reading activity yet.'; }
        var recentSkills = [];
        s.recent.slice(0, 3).forEach(function (a) {
            a.summary.skills.forEach(function (k) {
                if (recentSkills.indexOf(k.skill) < 0) { recentSkills.push(k.skill); }
            });
        });
        recentSkills = recentSkills.slice(0, 3).map(function (x) { return x.toLowerCase(); });
        var list = recentSkills.length <= 1 ? recentSkills.join('')
            : recentSkills.slice(0, -1).join(', ') + ' and ' + recentSkills[recentSkills.length - 1];
        return name + ' has recently practiced ' + list + '.';
    }

    RW.progress = {
        STRONG_FROM: STRONG_FROM,
        PRACTICE_BELOW: PRACTICE_BELOW,
        MIN_QUESTIONS: MIN_QUESTIONS,
        completedAttempts: completedAttempts,
        skillTotals: skillTotals,
        improvements: improvements,
        stats: stats,
        summarySentence: summarySentence,
        dayKey: dayKey,
        formatDate: formatDate
    };
})(window);
