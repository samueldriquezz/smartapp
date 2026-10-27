// /castra - admin dashboard for the YouTube project (rewritten here by vercel.json).
// Only ONE address can get in: a one time code is mailed to it (Resend), and a correct code sets a
// signed 30 day session cookie. Any other address gets the same "code sent" screen and nothing else.
//
// Stateless: the pending code lives in a signed, HttpOnly cookie (code hash + expiry), so there is no
// database. Signing key comes from CASTRA_SECRET when set, otherwise it is derived from RESEND_API_KEY
// (rotating that key simply logs everyone out).

const crypto = require('crypto');
const { render, renderChannel, login } = require('./_castra/page');
const data = require('./_castra/data.json');

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
    let s = ''; req.on('data', c => { s += c; if (s.length > 4096) req.destroy(); });
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

  if (url.searchParams.get('logout')) {
    return html(res, 302, '', { Location: '/castra', 'Set-Cookie': setCookie(SESSION, '', 0) });
  }

  if (req.method === 'POST') {
    const form = await readForm(req);

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
  if (url.searchParams.get('jobs')) {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ queue: !!RURL, jobs: await jobStatuses() }));
  }
  const ch = url.searchParams.get('ch');
  if (ch) { const page = renderChannel(data, ch); if (page) return html(res, 200, page); }
  return html(res, 200, render(data, await jobStatuses().catch(() => ({})), !!RURL));
};
