// POST /api/lead - every landing-page lead goes to two places at once:
//   1. an email to Samuel (Resend)
//   2. a new row in the leads Google Sheet (Apps Script web app, see integrations/leads-sheet.gs)
// Each channel fails on its own: the request succeeds if either one delivered, so an outage in
// one of them costs a notification, not the lead.

const TO = 'samueldriquezz@gmail.com';
const FROM = 'SmartApp Leads <leads@joinkapi.com>'; // joinkapi.com is the verified Resend sender

const clip = (v, n = 300) => String(v ?? '').trim().slice(0, n);

// 050-123-4567 / +972 50 123 4567 / 972501234567 -> 0501234567
function normalisePhone(raw) {
  let d = String(raw || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+972')) d = '0' + d.slice(4);
  else if (d.startsWith('972')) d = '0' + d.slice(3);
  d = d.replace(/\D/g, '');
  return /^0\d{8,9}$/.test(d) ? d : null;
}

function israelTime(date) {
  return new Intl.DateTimeFormat('he-IL', {
    timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short',
  }).format(date);
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sendEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY missing');
  const rows = [
    ['שם', lead.name],
    ['טלפון', lead.phone],
    ['זמן', lead.time],
    ['מקור', lead.source || 'ישיר'],
    ['קמפיין', lead.campaign],
    ['מודעה', lead.content],
    ['עמוד', lead.page],
  ].filter(([, v]) => v);
  const wa = `https://wa.me/972${lead.phone.slice(1)}`;
  const html = `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;color:#15111c">
    <h2 style="margin:0 0 12px">ליד חדש מהאתר 🚀</h2>
    <table style="border-collapse:collapse">${rows.map(([k, v]) =>
      `<tr><td style="padding:4px 0 4px 16px;color:#777">${k}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table>
    <p style="margin-top:18px"><a href="${wa}" style="background:#25D366;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none">לשלוח וואטסאפ</a>
    &nbsp; <a href="tel:${lead.phone}">להתקשר</a></p></div>`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], subject: `ליד חדש: ${lead.name} · ${lead.phone}`, html }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

// Same columns, order and formats as Samuel's main leads table (the Meta form leads), so rows can move between tabs.
const SHEET_HEADERS = ['תאריך', 'שם הלקוח', 'מספר טלפון', 'האם יש לך רעיון', 'אתר/אפליקציות', 'מקור', 'תאריך קבלת ליד', 'פולואפ הבא', 'סטטוס'];
const sheetRow = lead => [lead.iso, lead.name, '972' + lead.phone.slice(1), '', '', 'אתר', '', '', ''];

async function appendRow(lead) {
  const url = process.env.LEADS_SHEET_URL;
  const secret = process.env.LEADS_SHEET_SECRET;
  if (!url || !secret) throw new Error('LEADS_SHEET_URL / LEADS_SHEET_SECRET missing');
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, headers: SHEET_HEADERS, row: sheetRow(lead), ...lead }), // ...lead keeps a not-yet-updated script working
    redirect: 'follow',
  });
  const text = await r.text();
  if (!r.ok || !text.includes('"ok":true')) throw new Error(`Sheet ${r.status}: ${text.slice(0, 200)}`);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  if (b.company) return res.status(200).json({ ok: true }); // honeypot: bots fill hidden fields

  const name = clip(b.name, 80);
  const phone = normalisePhone(b.phone);
  if (name.length < 2 || !phone) return res.status(400).json({ ok: false, error: 'invalid' });

  const now = new Date();
  const lead = {
    iso: now.toISOString(),
    time: israelTime(now),
    name,
    phone,
    source: clip(b.utm_source, 80),
    medium: clip(b.utm_medium, 80),
    campaign: clip(b.utm_campaign, 120),
    content: clip(b.utm_content, 120),
    page: clip(b.page, 300),
    referrer: clip(b.referrer, 300),
  };

  const [mail, sheet] = await Promise.allSettled([sendEmail(lead), appendRow(lead)]);
  if (mail.status === 'rejected') console.error('lead email failed:', mail.reason);
  if (sheet.status === 'rejected') console.error('lead sheet failed:', sheet.reason);

  const delivered = mail.status === 'fulfilled' || sheet.status === 'fulfilled';
  if (!delivered) console.error('LEAD LOST', JSON.stringify(lead));
  return res.status(delivered ? 200 : 502).json({ ok: delivered, mail: mail.status, sheet: sheet.status });
};
