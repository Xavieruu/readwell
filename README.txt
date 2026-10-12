READWELL — Part 3
Reading comprehension practice for students, with parent-managed accounts.
Plain HTML, CSS and JavaScript. No frameworks, no backend, NO AI of any kind:
all feedback, scores and recommendations come from simple written rules.

HOW TO RUN
Open index.html in a browser. Nothing to install.

PROTOTYPE WARNING
Data is saved only in this browser (localStorage) and sign-in is simulated.
Passwords and PINs are stored as salted hashes, but this is NOT real security.
Part 4 (a backend) must handle sign-in properly. Do not use real passwords.

FOLDER STRUCTURE
ReadWell/
  index.html                  Landing page
  parent/
    parent-register.html      Parent sign-up
    parent-login.html         Parent login
    account-recovery.html     Forgot password (recovery code) / student help
    add-child.html            Create a child profile (shows username + default PIN)
    parent-dashboard.html     Viewing: [child]. Summary, Activity, Progress
    child-management.html     List of children
    parent-settings.html      Own email/password + Student Account Management
  student/
    student-login.html        Student login (username + PIN)
    student-dashboard.html    Home: "up next" card and links
    reading.html              Story library + reader (questions, hints, notes, timer)
    results.html              Score, skills, original vs practice, recommendation
    review.html               Every question, your answer, the right answer and why
    progress.html             Scores, skills, good at / practice more, achievements
    activity-history.html     Every finished attempt (Original / Practice)
    bookmarks.html            Saved stories
    accessibility.html        Presets and individual reading settings
    profile.html              Student's own details + optional reading timer
  activities/
    passages-data.js          The 19 story texts (6+ Beginner, Intermediate, Advanced)
    questions-data.js         94 hand-written questions (answers, hints, evidence)
    activities-data.js        Joins passages + questions; lookup functions
  css/
    global.css                Colors/tokens, base, layout, header/footer, bands, utilities
    components.css            Cards, buttons, forms, alerts, lists, badges, meters
    public.css                Landing page and sign-in screens
    parent.css                Parent pages
    reading.css               Reader, questions, notes, text-to-speech, results, review
    student.css              Student display modes (dark, high contrast, text size, reduced motion)
    responsive.css            Rules for tablet and phone (loaded last)
  js/
    storage.js                All localStorage reading/writing (RW.store)
    auth.js                   Simulated sign-in, page guards, account changes
    layout.js                 Header, navigation, footer, form helpers
    settings.js               Student accessibility settings and presets
    questions.js              Starting attempts, hints, scoring, summaries
    progress.js               Totals, skill accuracy, improvement (per student)
    recommendations.js        Rule-based "what to read next"
    achievements.js           Five calm achievements, worked out from attempts
    reading.js                Library + reader page, bookmarks, timer
    results.js / review.js    Results and review pages
    annotations.js            Highlights and notes
    tts.js                    Read-aloud (browser speech)
    student-dashboard.js, student-progress.js, activity-history.js,
    bookmarks.js, profile.js, accessibility.js     Student page scripts
    parent.js, child-management.js, parent-settings.js,
    add-child.js, parent-login.js, parent-register.js,
    student-login.js, account-recovery.js           Parent / sign-in page scripts
  assets/images, assets/icons Reserved for pictures and icons (none needed yet)

DATA (localStorage keys)
  rw_parents, rw_students, rw_activities, rw_attempts, rw_settings,
  rw_annotations, rw_bookmarks.   sessionStorage: rw_session, rw_selected_child.

SCORING AND RECOMMENDATION RULES
  A question is correct when the FIRST answer is right. Try Again never changes the score.
  Below 60%  -> another Beginner activity (one with the hardest skill if possible)
  60% to 79% -> another activity at the same level
  80%+       -> a more challenging level (Advanced stays Advanced)
  Skill hint -> lowest-accuracy skill (2+ questions, under 70%) gets a suggested activity.
  Wording is encouraging. Nothing labels or diagnoses a child.

SECURITY NOTES FOR PART 4
  - Students cannot open parent pages; a parent can only read and change their own children.
  - Student PIN: sign-in checks pinHash. "displayPin" exists only for a system-generated
    default PIN; a PIN the parent chooses is never shown again. In a real backend store only
    a slow hash (bcrypt/argon2) and show a new PIN once instead of keeping a viewable one.
  - Parent email change and password change both require the current password.


=========================================================
REDESIGN NOTES (wider layout, icons, animation)
=========================================================
New files
  css/animations.css          icon chips, entrance/hover motion, art colours
  js/icons.js                 inline SVG icon set (RW.icons) + animated book art
  js/lottie-slots.js          optional Lottie player for <div data-lottie="...">
  assets/vendor/              lottie-web (light build) + its licence
  assets/animations/          put your LottieFiles .json files here

Layout: --container (1840px) and --gutter in css/global.css control page width.
Colours: green gradient page, dark green header/footer with white text,
cards in soft white/grey with one fixed dark ink colour (--ink).

Adding LottieFiles animations
  1. Download a free "Lottie JSON" file from lottiefiles.com.
  2. Save it as assets/animations/hero-book.json (home page hero)
     or assets/animations/empty.json (empty states).
  3. Deploy. If the file is missing or the page is opened as file://, the
     built-in animated SVG is shown instead. Lottie only plays over http(s)
     (for example on Vercel). Animations pause when Reduced motion is on.


=========================================================
OPTIONAL: AI STUDY TIPS (Google Gemini)
=========================================================
Off by default. A parent turns it on per child in Parent > Settings
("Allow AI study tips"). The child then sees a "Get study tips" button
on the Progress page. The rule-based advice is always shown as well.

Files: api/suggest.js (server), js/ai-tips.js (button), plus the opt-in
checkbox in js/parent-settings.js and storage key rw_ai_tips.

Setup on Vercel (the API key is NEVER put in the website code):
  1. Get a key at https://aistudio.google.com/apikey
  2. Vercel > your project > Settings > Environment Variables
     Name: GEMINI_API_KEY   Value: (your key)   (all environments)
  3. Optional: GEMINI_MODEL (default gemini-2.5-flash)
  4. Redeploy (Deployments > ... > Redeploy). The api/ folder must be
     at the project root, next to index.html.

Privacy: only skill names, percentages, an average and a level are sent.
No name, username, school or email. The server re-checks every field
and rate-limits requests. It does not work when a page is opened from a
folder (file://); use the deployed site or `vercel dev`.
Note: this breaks the "no AI" rule of earlier parts, but only as this
opt-in extra. Delete api/ and js/ai-tips.js to remove it.


=========================================================
AI COACH NOTE ON EACH QUIZ ANSWER (same opt-in as study tips)
=========================================================
After a student submits an answer, a "Coach note" appears under the normal
feedback. It is extra: the normal feedback always shows first, the score is
never changed, and if Gemini is busy the note simply does not appear.
  - Right answer: praise + why it is right.
  - Wrong answer (tries 1-2): a gentle nudge about which part of the story to
    re-read, WITHOUT telling the correct answer.
  - Wrong answer (3rd try): the correct answer is explained.
Files: api/feedback.js, api/_gemini.js (shared helper), js/ai-feedback.js,
vercel.json (makes the story data files available to api/feedback.js).
The browser sends only the question id, the chosen answer and the try number.
The server reads the story and question from its own data files and checks
the answer is one of the real choices, so no free text can reach Gemini.
Models: gemini-3.8-flash first, then gemini-flash-latest, gemini-2.5-flash.
Set GEMINI_MODEL in Vercel to force one. Check Vercel > Logs for "Gemini error".
