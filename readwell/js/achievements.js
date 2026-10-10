/* =========================================================
   ReadWell — achievements (calm, no points, no rankings)
   Each achievement is worked out from the student's own saved
   attempts every time, so nothing extra is stored. They are small
   "well done" notes, not a score to chase.
   ========================================================= */
(function (global) {
    'use strict';

    var RW = global.RW = global.RW || {};

    function list(studentId) {
        var all = RW.store.getAttemptsByStudent(studentId);
        var done = RW.progress.completedAttempts(studentId);

        var improved = RW.progress.improvements(done).some(function (i) { return i.difference > 0; });
        var skills = {};
        done.forEach(function (a) { a.summary.skills.forEach(function (s) { skills[s.skill] = true; }); });
        var skillCount = Object.keys(skills).length;
        var reviewed = all.some(function (a) { return a.status === 'completed' && a.reviewedAt; });
        var days = {};
        done.forEach(function (a) { days[RW.progress.dayKey(a.completedAt)] = true; });
        var dayCount = Object.keys(days).length;

        return [
            { key: 'first-activity', title: 'First Activity', earned: done.length >= 1,
              description: 'Finish your first reading activity.',
              note: done.length >= 1 ? 'You finished your first activity.' : 'Not yet' },
            { key: 'practice-progress', title: 'Practice Makes Progress', earned: improved,
              description: 'Score higher on a practice attempt than on the original.',
              note: improved ? 'Your practice score went up.' : 'Not yet' },
            { key: 'skill-explorer', title: 'Skill Explorer', earned: skillCount >= 6,
              description: 'Practice 6 different reading skills.',
              note: skillCount >= 6 ? 'You practiced ' + skillCount + ' skills.' : skillCount + ' of 6 skills so far' },
            { key: 'review-ready', title: 'Review Ready', earned: reviewed,
              description: 'Open the answer review after finishing an activity.',
              note: reviewed ? 'You reviewed your answers.' : 'Not yet' },
            { key: 'consistent-reader', title: 'Consistent Reader', earned: dayCount >= 3,
              description: 'Finish activities on 3 different days.',
              note: dayCount >= 3 ? 'You read on ' + dayCount + ' different days.' : dayCount + ' of 3 days so far' }
        ];
    }

    RW.achievements = { list: list };
})(window);
