/* =========================================================
   ReadWell — shared Gemini helper for the files in /api
   (A file whose name starts with "_" is not turned into a web
   address by Vercel. It is only a helper for the other files.)

   - generate(): asks Gemini and returns the parsed JSON answer.
     It tries a list of models in order, because Google retires
     model names from time to time, and retries once on a 503.
   - tooMany(): a tiny per-visitor rate limit.
   The API key is read from the GEMINI_API_KEY environment variable.
   ========================================================= */

var hits = {};

/* true when this visitor has made more than `limit` calls in `windowMs`. */
function tooMany(ip, limit, windowMs) {
    var now = Date.now();
    var key = String(ip);
    var list = (hits[key] || []).filter(function (t) { return now - t < windowMs; });
    list.push(now);
    hits[key] = list;
    return list.length > limit;
}

function modelList() {
    return [process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.5-flash']
        .filter(function (m, i, all) { return m && all.indexOf(m) === i; });
}

function pause(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }

/* options: { system, prompt, maxTokens, temperature, text, schema }
   text:true  -> returns the reply as a plain string (safest).
   otherwise  -> asks for JSON using `schema` and returns the parsed object.
   Throws an Error when nothing worked. */
async function generate(options) {
    var key = process.env.GEMINI_API_KEY;
    if (!key) { var missing = new Error('no key'); missing.code = 'NO_KEY'; throw missing; }

    /* Plain-text mode: no JSON to break if the reply is cut short. */
    var textMode = options.text === true;

    var payload = JSON.stringify({
        systemInstruction: { parts: [{ text: options.system }] },
        contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
        generationConfig: textMode ? {
            temperature: options.temperature === undefined ? 0.6 : options.temperature,
            maxOutputTokens: options.maxTokens || 2048
        } : {
            temperature: options.temperature === undefined ? 0.6 : options.temperature,
            maxOutputTokens: options.maxTokens || 2048,
            responseMimeType: 'application/json',
            responseSchema: options.schema
        }
    });

    var models = modelList();
    var reply = null;
    for (var m = 0; m < models.length; m++) {
        var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(models[m]) + ':generateContent';
        for (var attempt = 0; attempt < 2; attempt++) {
            reply = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                body: payload
            });
            if (reply.status !== 503 || attempt === 1) { break; }
            await pause(800);
        }
        if (reply.ok) { break; }
        /* Shows up in Vercel > Logs. The key itself is never logged. */
        console.error('Gemini error', models[m], reply.status, (await reply.text()).slice(0, 300));
    }
    if (!reply || !reply.ok) { throw new Error('Gemini unavailable'); }

    var json = await reply.json();
    var part = json && json.candidates && json.candidates[0] && json.candidates[0].content &&
        json.candidates[0].content.parts && json.candidates[0].content.parts[0];
    if (!part || !part.text) {
        console.error('Gemini gave no text:', JSON.stringify(json).slice(0, 400));
        throw new Error('empty reply');
    }
    var cutShort = json.candidates[0].finishReason === 'MAX_TOKENS';
    if (cutShort) { console.error('Gemini reply was cut short (MAX_TOKENS)'); }
    if (textMode) { return trimToSentence(part.text, cutShort); }
    return JSON.parse(part.text);
}

/* If a reply was cut off in the middle of a sentence, drop the broken end. */
function trimToSentence(text, cutShort) {
    var t = String(text).trim();
    if (!cutShort || /[.!?]$/.test(t)) { return t; }
    var last = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '));
    return last > 20 ? t.slice(0, last + 1) : t;
}

/* Removes markdown symbols and trims a text to a safe length. */
function tidy(text, max) {
    return String(text).replace(/[*_#`]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

module.exports = { generate: generate, tooMany: tooMany, tidy: tidy };
