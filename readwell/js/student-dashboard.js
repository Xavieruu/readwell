/* ReadWell — student/student-dashboard.html (the student's home page)
   Greets the student, offers one "up next" suggestion and links to the
   other student pages. Everything shown belongs to the signed-in student. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, byId = ui.byId;
    var content = RW.content, store = RW.store;

    /* The student comes from the session, so a student only sees their own data. */
    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    RW.settings.init(id);

    byId('home-title').textContent = 'Hi, ' + student.name + '!';
    byId('tile-reading-desc').textContent =
        'Read a story and answer questions. ' + content.getStories().length + ' stories in 3 levels.';

    var saved = store.getBookmarks(id).length;
    byId('tile-bookmarks-desc').textContent = saved
        ? saved + (saved === 1 ? ' story saved.' : ' stories saved.')
        : 'Stories you saved to read again.';

    /* 1) An unfinished story comes first.  2) Otherwise a rule-based suggestion. */
    var open = null;
    store.getAttemptsByStudent(id).forEach(function (a) {
        if (a.status === 'in_progress' && content.getStory(a.storyId)) { open = a; }
    });

    var card = byId('next-card');
    var link = byId('next-link');
    if (open) {
        var story = content.getStory(open.storyId);
        byId('next-heading').textContent = 'Keep going';
        byId('next-text').textContent = 'You have not finished ' + story.title + ' yet.';
        byId('next-meta').textContent = content.levelLabel(story.level) + ' · ' + story.questions.length + ' questions';
        link.textContent = 'Continue reading';
        link.setAttribute('href', 'reading.html?story=' + encodeURIComponent(story.storyId));
        card.hidden = false;
    } else {
        var rec = RW.recommendations.forHome(id);
        if (rec) {
            byId('next-heading').textContent = 'Up next';
            byId('next-text').textContent = rec.text + ' ' + rec.story.title + '.';
            byId('next-meta').textContent = content.levelLabel(rec.story.level) + ' · ' + rec.story.questions.length + ' questions';
            link.textContent = 'Start ' + rec.story.title;
            link.setAttribute('href', 'reading.html?story=' + encodeURIComponent(rec.story.storyId));
            card.hidden = false;
        }
    }
})();
