# ReadWell

Reading-comprehension practice for students, built to be friendly for learners who need extra support (SPED-friendly). Parents create and manage child accounts; students read short stories, answer questions with hints, and see calm, encouraging progress.

**Live site:** https://readwell-gilt.vercel.app

Plain HTML, CSS and JavaScript on the front end. No framework and no build step. Two small Vercel serverless functions add optional AI feedback, and Firebase handles parent sign-in.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Run it locally](#run-it-locally)
- [Deploy to Vercel](#deploy-to-vercel)
- [Environment variables and secrets](#environment-variables-and-secrets)
- [How the data is stored](#how-the-data-is-stored)
- [AI features](#ai-features)
- [Accessibility](#accessibility)
- [Design notes](#design-notes)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Features

**For parents**
- Sign up and log in with email and password, or with Google (Firebase Authentication). Password reset by email.
- Add child profiles. Each child gets a student username and a generated PIN, shown once on a "profile created" card with Copy buttons.
- Dashboard for one child at a time: activity summary, skills recently practiced, skills that may need more practice, suggested next activity.
- Activity and Progress tabs per child.
- Settings: change username, make a new PIN or choose one, and opt each child in or out of AI study tips.

**For students**
- Log in with username and PIN.
- Story library: 19 hand-written stories across Beginner, Intermediate and Advanced levels, with 94 questions.
- Reader with hints (up to three per question), highlighting and notes, bookmarks, and an optional count-up timer that never locks a question or changes the score.
- Hints switch off once an answer is submitted. Try Again turns them back on.
- Results and review pages: score, skills, original attempt vs practice attempt, and why each answer is right.
- Progress page: scores over time, accuracy by skill, what you are good at and what to practice more, achievements.
- Bookmarks and activity history.
- Read-aloud for stories and questions, using the browser's built-in voices.

**For everyone**
- Reading presets and individual settings: text size, line and letter spacing, light / dark / high-contrast display, reading width, reading speed, reduced motion.

## Tech stack

| Area | Choice |
|---|---|
| Front end | HTML, CSS, vanilla JavaScript (IIFE modules on `window.RW`) |
| Parent sign-in | Firebase Authentication (Web SDK 11, loaded from Google's CDN) |
| AI (optional) | Google Gemini API, called only from serverless functions |
| Hosting and functions | Vercel (static files plus `api/` functions) |
| Local data | `localStorage` and `sessionStorage` |
| Animations | CSS and inline SVG, with optional Lottie drop-in slots |

## Project structure

```
index.html                 Landing page
vercel.json                Bundles activities/ data into the feedback function
api/
  _gemini.js               Shared Gemini helper (model fallback, retry, rate limit)
  suggest.js               POST: study tips from skill percentages
  feedback.js              POST: short coach note for one answer
parent/                    Register, login, recovery, add child, dashboard,
                           children list, settings
student/                   Login, home, reading, results, review, progress,
                           history, bookmarks, accessibility, profile
activities/
  passages-data.js         The 19 story texts
  questions-data.js        94 questions with choices, hints and explanations
  activities-data.js       Joins passages and questions
css/
  global.css               Design tokens, base styles, layout, header and footer
  components.css           Cards, buttons, forms, alerts, chips, meters
  animations.css           Gentle motion (all off with reduced motion)
  public.css  parent.css  student.css  reading.css
  responsive.css           Tablet and phone rules, loaded last
js/
  storage.js               All localStorage access (RW.store)
  auth.js                  Sign-in, page guards, account changes
  layout.js                Header, nav, footer, form and (i) info helpers
  firebase-config.js       Public Firebase web config
  firebase-init.js         Loads the Firebase SDK
  questions.js progress.js recommendations.js achievements.js settings.js
  reading.js results.js review.js annotations.js tts.js
  ai-tips.js ai-feedback.js
  (page scripts: parent.js, parent-settings.js, add-child.js, ...)
assets/                    Icons, images, optional Lottie files and player
CHANGELOG.txt              History of changes
```

CSS load order: public pages use `global, components, animations, public, responsive`. Parent pages use `global, components, animations, parent, responsive`. Student pages use `global, components, animations, reading, student, responsive`.

## Run it locally

Firebase's SDK loads as an ES module, so open the site through a small web server, not by double-clicking the file.

```bash
# from the project folder
python3 -m http.server 8000
# then open http://localhost:8000
```

To also test the AI functions locally, use the Vercel CLI instead. It serves the static files and the `api/` routes together:

```bash
npm i -g vercel
vercel dev
```

Add `localhost` to Firebase **Authentication > Settings > Authorized domains** if you want Google sign-in to work locally. Without a `GEMINI_API_KEY`, the AI features simply stay hidden or show a friendly "not set up" message. Everything else works.

## Deploy to Vercel

1. Push this folder to a GitHub repository, with `index.html` and `api/` at the repository root.
2. Import the repository in Vercel. No build command or output directory is needed.
3. Add the environment variable below, then redeploy. Environment variable changes only apply to new deployments.
4. In Firebase, enable **Email/Password** and **Google** under Authentication > Sign-in method, and add your Vercel domain (for example `readwell-gilt.vercel.app`) under Authorized domains.

Every push to the main branch redeploys automatically.

## Environment variables and secrets

| Name | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Vercel project settings (Secret) | Lets the `api/` functions call Gemini. **Required for AI features.** |
| `GEMINI_MODEL` | Vercel project settings (optional) | Preferred Gemini model; otherwise a built-in fallback list is tried |

**Never commit secrets.** The Gemini key lives only in Vercel. The Firebase web config in `js/firebase-config.js` is public by design: it only says which Firebase project to talk to, and Firebase's own sign-in and security rules protect the data. A Firebase *service-account* key (used in the planned student-login stage) must also live only in a Vercel environment variable, never in the code, GitHub or any chat.

## How the data is stored

Right now the app is **partly** cloud-backed:

| Data | Where it lives |
|---|---|
| Parent accounts and sign-in | Firebase Authentication |
| Child profiles, PIN hashes, attempts, bookmarks, notes, settings | The browser's `localStorage` |
| Current login and selected child | `sessionStorage` |

Because child data is in the browser, it is not shared between devices. A parent adding a child on one computer will not see that child on another. Moving this into a database is the first item on the roadmap.

## AI features

Both are **off by default** and switched on per child by a parent in Settings.

- **Study tips** (student Progress page): three short, kind suggestions based on skill percentages.
- **Coach note** (reader): a one or two sentence nudge after each answer, without giving the answer away.

Privacy: only skill names, percentages, a question id and the chosen answer are sent. No name, username, school or email ever leaves the browser. The coach function re-reads the question from the server's own copy of the data and rejects anything that does not match. Requests are rate limited per IP. AI text is always labelled as written by a computer program and never changes a score.

If Gemini is busy or unavailable the app retries once, then shows a friendly message and a "try again" button. The quiz always works without it.

## Accessibility

- Semantic landmarks, skip link, visible focus rings, and labels on every control.
- Errors are announced and focus moves to the first problem.
- Text size, spacing, contrast and motion settings are saved and applied on every page.
- Explanations on forms sit behind a keyboard-friendly (i) button instead of cluttering the field.
- Scoring is never timed, and the optional timer only counts up.
- Wording stays neutral and encouraging: no labels, no diagnoses.

## Design notes

The identity is green and white, kept calm on purpose. One fixed ink colour for text, soft white and gray surfaces for depth, one green for actions. No heavy glow, blobs, glassmorphism or loud animation. Spacing comes from tokens in `css/global.css` (`--s-1` to `--s-7`). To change padding or margins site-wide, edit those tokens first.

## Known limitations

- Child data is stored in the browser only (see above).
- Student login (username and PIN) is still checked in the browser, so it is **not** real security. Do not use real passwords or personal data for children yet.
- Read-aloud uses the browser's built-in voices. Some Linux setups have none, in which case Play shows a message instead of speaking.
- The AI functions depend on Google's free-tier limits and model availability.

## Roadmap

1. **Stage 2:** move children, attempts and progress to Firestore with security rules, so data follows the parent across devices.
2. **Stage 3:** real student login. A Vercel function using the Firebase Admin SDK checks the username and a hashed PIN, with lockout after repeated wrong tries.
3. Natural-sounding pre-generated audio for the stories and questions.

---

Built as a school project. Story texts are original retellings of familiar fairy tales and fables.
