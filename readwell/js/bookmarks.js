/* ReadWell — student/bookmarks.html
   Lists the stories this student bookmarked. They can open or remove each one. */
(function () {
    'use strict';

    var RW = window.RW;
    var ui = RW.ui, el = ui.el, byId = ui.byId;
    var content = RW.content, store = RW.store;

    var student = RW.auth.requireStudent();
    if (!student) { return; }
    var id = student.studentId;
    RW.settings.init(id);

    function render() {
        var list = byId('bookmark-list');
        ui.clear(list);

        // Newest bookmark first (the list is stored oldest first); skip stories that no longer exist.
        var items = store.getBookmarks(id)
            .filter(function (storyId) { return content.getStory(storyId); })
            .reverse();

        byId('empty').hidden = items.length > 0;
        byId('list-card').hidden = items.length === 0;

        items.forEach(function (storyId) {
            var story = content.getStory(storyId);
            var status = RW.questions.storyStatus(id, story);
            var badge = status.open ? 'In progress'
                : status.latest ? 'Completed: ' + status.latest.summary.percent + '%' : 'Not started';

            var remove = el('button', { type: 'button', class: 'btn btn-secondary btn-sm',
                'aria-label': 'Remove bookmark for ' + story.title, text: 'Remove bookmark' });
            remove.addEventListener('click', function () {
                store.toggleBookmark(id, story.storyId);
                render();
                var title = byId('page-title');
                title.focus();
            });

            list.appendChild(el('li', {}, [el('article', { class: 'story-card' }, [
                el('h3', { text: story.title }),
                el('p', { text: story.blurb }),
                el('p', { class: 'story-meta', text: content.levelLabel(story.level) + ' · ' + story.questions.length + ' questions · about ' + content.minutes(story) + ' min to read' }),
                el('p', {}, [el('span', { class: 'badge badge-outline', text: badge })]),
                el('div', { class: 'button-row' }, [
                    el('a', { class: 'btn btn-primary btn-sm', href: 'reading.html?story=' + encodeURIComponent(story.storyId),
                        text: status.open ? 'Continue' : status.latest ? 'Practice again' : 'Start reading' }),
                    remove
                ])
            ])]));
        });
    }

    render();
})();
