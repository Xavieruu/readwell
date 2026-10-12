/* =========================================================
   ReadWell — /api/suggest  (Vercel serverless function)
   Asks Google Gemini for 3 short, friendly study tips.

   WHY THIS FILE EXISTS: the Gemini API key must stay secret.
   It lives in a Vercel environment variable (GEMINI_API_KEY) and is
   only ever read here, on the server. The browser never sees it.

   PRIVACY: the browser sends only skill names, percentages and a
   level. It never sends a name, username, school or any account data.
   Everything is re-checked below, so a made-up request cannot send
   free text to Gemini.

   Set in Vercel > Project > Settings > Environment Variables:
     GEMINI_API_KEY   (required)
     GEMINI_MODEL     (optional, default gemini-2.5-flash)
   ========================================================= */

var SKILLS = ['Main Idea', 'Supporting Details', 'Sequencing', 'Cause and Effect',
    'Organizing Information', 'Inference', 'Evidence-Based Reasoning',
    'Vocabulary in Context', "Author's Purpose", 'Critical Evaluation', 'Tone', 'Mood'];
var LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/* Very small rate limit per visitor (resets when the server restarts). */
var hits = {};
var LIMIT = 10;            // requests
var WINDOW_MS = 10 * 60e3; // per 10 minutes

function tooMany(ip) {
    var now = Date.now();
    var list = (hits[ip] || []).filter(function (t) { return now - t < WINDOW_MS; });
    list.push(now);
    hits[ip] = list;
    return list.length > LIMIT;
}

function clean(body) {
    if (!body || typeof body !== 'object') { return null; }
    var average = Number(body.average);
    if (!(average >= 0 && average <= 100)) { return null; }
    var level = LEVELS.indexOf(body.level) >= 0 ? body.level : 'Beginner';
    if (!Array.isArray(body.skills) || body.skills.length === 0 || body.skills.length > 12) { return null; }
    var skills = [];
    for (var i = 0; i < body.skills.length; i++) {
        var s = body.skills[i];
        var pct = Number(s && s.percent);
        var total = Number(s && s.total);
        if (!s || SKILLS.indexOf(s.skill) < 0 || !(pct >= 0 && pct <= 100) || !(total >= 1 && total <= 500)) { return null; }
        skills.push({ skill: s.skill, percent: Math.round(pct), total: Math.round(total) });
    }
    return { average: Math.round(average), level: level, skills: skills };
}

var SYSTEM =
    'You write short study tips for a child who is practicing reading comprehension. ' +
    'Use simple, warm, encouraging words a student aged 8 to 14 can read. ' +
    'Give exactly 3 tips. Each tip is one or two sentences and under 220 characters. ' +
    'Be specific about the skills listed and say what the child can DO, for example re-read the first paragraph or find the clue word. ' +
    'Never use the words weak, bad, poor, slow, struggle or fail. Never mention disabilities, diagnoses or ability. ' +
    'Do not ask for or mention names or personal details. Do not use emojis or markdown.';

function buildPrompt(d) {
    var lines = d.skills.map(function (s) {
        return '- ' + s.skill + ': ' + s.percent + '% correct on ' + s.total + ' questions';
    });
    return 'Current reading level: ' + d.level + '. Average score: ' + d.average + '%.\n' +
        'Skill results (first-try answers):\n' + lines.join('\n') + '\n' +
        'Write the 3 study tips now.';
}

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Use POST.' });
    }

    var key = process.env.GEMINI_API_KEY;
    if (!key) { return res.status(503).json({ error: 'Tips are not set up yet.' }); }

    var ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    if (tooMany(ip)) { return res.status(429).json({ error: 'Too many requests. Please wait a few minutes.' }); }

    var data = clean(req.body);
    if (!data) { return res.status(400).json({ error: 'Invalid request.' }); }

    /* Try the chosen model first, then a backup, in case one is retired or busy. */
    var models = [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest']
        .filter(function (m, i, all) { return m && all.indexOf(m) === i; });

    var payload = JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: 'user', parts: [{ text: buildPrompt(data) }] }],
        generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'OBJECT',
                properties: { tips: { type: 'ARRAY', items: { type: 'STRING' } } },
                required: ['tips']
            }
        }
    });

    try {
        var reply = null;
        for (var m = 0; m < models.length; m++) {
            var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[m]) + ':generateContent';
            reply = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                body: payload
            });
            if (reply.ok) { break; }
            /* Shows up in Vercel > Logs. The key itself is never logged. */
            console.error('Gemini error', models[m], reply.status, (await reply.text()).slice(0, 300));
        }
        if (!reply || !reply.ok) { return res.status(502).json({ error: 'The tips service is busy. Try again later.' }); }

        var json = await reply.json();
        var text = json && json.candidates && json.candidates[0] &&
            json.candidates[0].content && json.candidates[0].content.parts &&
            json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
        if (!text) { console.error('Gemini gave no text:', JSON.stringify(json).slice(0, 400)); }
        var tips = JSON.parse(text).tips;
        if (!Array.isArray(tips)) { throw new Error('bad shape'); }

        tips = tips.filter(function (t) { return typeof t === 'string' && t.trim(); })
            .slice(0, 3)
            .map(function (t) { return t.replace(/[*_#`]/g, '').trim().slice(0, 240); });
        if (!tips.length) { throw new Error('no tips'); }
        return res.status(200).json({ tips: tips });
    } catch (e) {
        console.error('suggest failed:', e && e.message ? e.message : e);
        return res.status(502).json({ error: 'Could not make tips right now. Try again later.' });
    }
};
