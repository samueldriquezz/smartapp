// /castra - admin dashboard for the YouTube project (rewritten here by vercel.json).
// Only ONE address can get in: a one time code is mailed to it (Resend), and a correct code sets a
// signed 30 day session cookie. Any other address gets the same "code sent" screen and nothing else.
//
// Stateless: the pending code lives in a signed, HttpOnly cookie (code hash + expiry), so there is no
// database. Signing key comes from CASTRA_SECRET when set, otherwise it is derived from RESEND_API_KEY
// (rotating that key simply logs everyone out).

const crypto = require('crypto');
const { render, renderChannel, renderSchedule, login } = require('./_castra/page');
const bundled = require('./_castra/data.json');
let data = bundled;                    // replaced per request by the live copy the Mac pushes to Redis

// ---- task queue (Upstash Redis over REST). The Mac agent pops jobs from castra:queue and writes
// castra:job:<task>. The web side only ever sends a known task id, never free text.
const RURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const RTOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
async function redis(...cmd) {
  if (!RURL || !RTOKEN) return null;
  const r = await fetch(RURL, { method: 'POST', headers: { Authorization: `Bearer ${RTOKEN}` }, body: JSON.stringify(cmd) });
  return r.ok ? (await r.json()).result : null;
}
const TASK_IDS = new Set((data.tasks || []).filter(t => t.prompt).map(t => t.id));
async function jobStatuses() {
  const ids = [...TASK_IDS];
  if (!ids.length || !RURL) return {};
  const vals = await redis('MGET', ...ids.map(i => `castra:job:${i}`)) || [];
  return Object.fromEntries(ids.map((id, i) => [id, vals[i] ? JSON.parse(vals[i]) : null]).filter(([, v]) => v));
}

const ALLOWED = 'samueldriquezz@gmail.com';
const FROM = 'CASTRA <leads@joinkapi.com>'; // joinkapi.com is the verified Resend sender
const SESSION = 'castra_session', PENDING = 'castra_pending';
const SESSION_DAYS = 30, CODE_MINUTES = 10;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 8 chars of this = 32^8, not guessable in 10 minutes

const key = () => crypto.createHash('sha256')
  .update('castra-v1:' + (process.env.CASTRA_SECRET || process.env.RESEND_API_KEY || '')).digest();
const mac = s => crypto.createHmac('sha256', key()).update(s).digest('hex');
const same = (a, b) => typeof a === 'string' && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

function cookie(req, name) {
  const raw = (req.headers.cookie || '').split(/;\s*/).find(c => c.startsWith(name + '='));
  return raw ? decodeURIComponent(raw.slice(name.length + 1)) : '';
}
const setCookie = (name, value, maxAge) =>
  `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

function validSession(req) {
  const [exp, sig] = cookie(req, SESSION).split('.');
  return !!exp && Number(exp) > Date.now() && same(sig, mac(`session:${ALLOWED}:${exp}`));
}

const html = (res, status, body, extra = {}) => {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow', 'X-Frame-Options': 'DENY', ...extra });
  res.end(body);
};

function readForm(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') return Promise.resolve(Object.fromEntries(new URLSearchParams(req.body)));
  return new Promise(resolve => {
    let s = ''; req.on('data', c => { s += c; if (s.length > 32768) req.destroy(); }); // room for Hebrew fix notes (about 6 bytes a letter encoded)
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(s))));
  });
}

async function mailCode(code) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [ALLOWED], subject: `קוד כניסה ל־CASTRA: ${code}`,
      html: `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;color:#15111c">
        <p>קוד הכניסה שלך ל־CASTRA:</p>
        <p style="font-size:30px;letter-spacing:6px;font-weight:bold;direction:ltr;text-align:right">${code}</p>
        <p style="color:#777">תקף ל־${CODE_MINUTES} דקות. אם לא ביקשת קוד, אפשר להתעלם מהמייל.</p></div>`,
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}`);
}

module.exports = async (req, res) => {
  if (!process.env.RESEND_API_KEY) return html(res, 503, 'CASTRA is not configured');
  const url = new URL(req.url, 'https://smartapp-agency.com');
  try { const live = await redis('GET', 'castra:data'); data = live ? JSON.parse(live) : bundled; } catch (e) { data = bundled; }

  if (url.searchParams.get('logout')) {
    return html(res, 302, '', { Location: '/castra', 'Set-Cookie': setCookie(SESSION, '', 0) });
  }

  if (req.method === 'POST') {
    const form = await readForm(req);

    if (form.step === 'approve') {
      if (!validSession(req)) return html(res, 401, 'unauthorized');
      const id = String(form.id || '');
      res.setHeader('Content-Type', 'application/json');
      const slot = (data.schedule || []).find(s => s.id === id && s.status === 'ready');
      if (!slot) { res.statusCode = 400; return res.end('{"ok":false}'); }
      if (!RURL) { res.statusCode = 503; return res.end('{"ok":false,"error":"queue not connected"}'); }
      await redis('SET', `castra:approve:${id}`, JSON.stringify({ id, date: slot.date, ts: Date.now() }));
      return res.end('{"ok":true}');
    }

    if (form.step === 'topic' || form.step === 'drop') {   // approve an idea's topic, or reject the idea
      if (!validSession(req)) return html(res, 401, 'unauthorized');
      const id = String(form.id || '');
      res.setHeader('Content-Type', 'application/json');
      const slot = (data.schedule || []).find(s => s.id === id && s.status === 'idea');
      if (!slot) { res.statusCode = 400; return res.end('{"ok":false}'); }
      if (!RURL) { res.statusCode = 503; return res.end('{"ok":false,"error":"queue not connected"}'); }
      await redis('SET', `castra:${form.step}:${id}`, JSON.stringify({ id, ts: Date.now() }));
      return res.end('{"ok":true}');
    }

    if (form.step === 'fix') {                     // reject with a note: the Mac fixes it and sends it back for approval
      if (!validSession(req)) return html(res, 401, 'unauthorized');
      const id = String(form.id || ''), note = String(form.note || '').trim().slice(0, 3000);
      res.setHeader('Content-Type', 'application/json');
      const slot = (data.schedule || []).find(s => s.id === id && s.video && ['text_ready', 'ready', 'approved', 'scheduled', 'fixing'].includes(s.status));
      if (!slot || note.length < 3) { res.statusCode = 400; return res.end('{"ok":false}'); }
      if (!RURL) { res.statusCode = 503; return res.end('{"ok":false,"error":"queue not connected"}'); }
      const at = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
      await redis('SET', `castra:fix:${id}`, JSON.stringify({ id, note, at, ts: Date.now() }));
      await redis('DEL', `castra:approve:${id}`);
      return res.end('{"ok":true}');
    }

    if (form.step === 'run') {
      if (!validSession(req)) return html(res, 401, 'unauthorized');
      const task = String(form.task || '');
      res.setHeader('Content-Type', 'application/json');
      if (!TASK_IDS.has(task)) { res.statusCode = 400; return res.end('{"ok":false,"error":"unknown task"}'); }
      if (!RURL) { res.statusCode = 503; return res.end('{"ok":false,"error":"queue not connected"}'); }
      const job = { task, status: 'queued', ts: Date.now() };
      await redis('SET', `castra:job:${task}`, JSON.stringify(job));
      await redis('LPUSH', 'castra:queue', JSON.stringify({ task, ts: job.ts }));
      return res.end(JSON.stringify({ ok: true, job }));
    }

    if (form.step === 'email') {
      const email = String(form.email || '').trim().toLowerCase();
      if (email !== ALLOWED) {                       // same screen, no code, no cookie
        await new Promise(r => setTimeout(r, 600));
        return html(res, 200, login('code', false));
      }
      const code = Array.from(crypto.randomBytes(8), b => ALPHABET[b % ALPHABET.length]).join('');
      const exp = String(Date.now() + CODE_MINUTES * 60e3);
      try { await mailCode(code); } catch (e) { console.error('castra mail', e.message); }
      return html(res, 200, login('code', false),
        { 'Set-Cookie': setCookie(PENDING, `${exp}.${mac(`code:${code}:${exp}`)}`, CODE_MINUTES * 60) });
    }

    if (form.step === 'code') {
      const code = String(form.code || '').trim().toUpperCase().replace(/\s+/g, '');
      const [exp, sig] = cookie(req, PENDING).split('.');
      const ok = !!exp && Number(exp) > Date.now() && same(sig, mac(`code:${code}:${exp}`));
      if (!ok) { await new Promise(r => setTimeout(r, 800)); return html(res, 401, login('code', true)); }
      const sexp = String(Date.now() + SESSION_DAYS * 864e5);
      res.setHeader('Set-Cookie', [setCookie(PENDING, '', 0),
        setCookie(SESSION, `${sexp}.${mac(`session:${ALLOWED}:${sexp}`)}`, SESSION_DAYS * 86400)]);
      return html(res, 303, '', { Location: '/castra' });
    }
    return html(res, 400, login('email', false));
  }

  if (!validSession(req)) return html(res, 200, login('email', false));
  const tid = url.searchParams.get('thumb');
  if (tid) {                                       // our own thumbnail (YouTube's is grey while a video is private)
    const ok = (data.schedule || []).some(s => s.id === tid);
    const b64 = ok ? await redis('GET', `castra:thumb:${tid}`) : null;
    if (!b64) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' });
    return res.end(Buffer.from(b64, 'base64'));
  }
  const sid = url.searchParams.get('script');
  if (sid) {                                       // a slot's script, loaded when its preview opens
    const ok = (data.schedule || []).some(s => s.id === sid);
    const text = ok ? await redis('GET', `castra:script:${sid}`) : null;
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ script: text || '' }));
  }
  if (url.searchParams.get('jobs')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ queue: !!RURL, jobs: await jobStatuses() }));
  }
  if (url.searchParams.get('p') === 'schedule') {
    const ids = (data.schedule || []).map(s => s.id);
    const vals = ids.length && RURL ? (await redis('MGET', ...ids.map(i => `castra:approve:${i}`), ...ids.map(i => `castra:fix:${i}`)) || []) : [];
    const fixes = Object.fromEntries(ids.map((id, i) => [id, vals[ids.length + i] ? JSON.parse(vals[ids.length + i]) : null]).filter(([, v]) => v));
    return html(res, 200, renderSchedule(data, Object.fromEntries(ids.map((id, i) => [id, !!vals[i]])), fixes));
  }
  const ch = url.searchParams.get('ch');
  if (ch) { const page = renderChannel(data, ch); if (page) return html(res, 200, page); }
  return html(res, 200, render(data, await jobStatuses().catch(() => ({})), !!RURL));
};
