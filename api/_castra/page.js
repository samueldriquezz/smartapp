// CASTRA admin pages. render(data) -> dashboard HTML, login(error) -> login HTML.
// Data is inlined server side, so nothing about the project is ever served as a public file.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US');

const HEAD = title => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head>`;

const CSS = `
:root{--bg:#06070c;--panel:rgba(16,18,30,.72);--line:rgba(255,255,255,.08);--ink:#eef0ff;--ink2:#a3a8c3;--ink3:#6b7090;
--cyan:#22e6ff;--mag:#ff3ec8;--vio:#8b5cf6;--lime:#b6ff3b;--amber:#ffb84a}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--ink);font-family:Heebo,system-ui,sans-serif;min-height:100%}
body{overflow-x:hidden}
.bg{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden}
.bg .grid{position:absolute;inset:-50%;background-image:linear-gradient(rgba(34,230,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(34,230,255,.06) 1px,transparent 1px);
background-size:56px 56px;transform:perspective(900px) rotateX(58deg) translateY(10%);transform-origin:center 70%;mask-image:radial-gradient(ellipse at 50% 60%,#000 20%,transparent 65%)}
.orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.55;animation:drift 22s ease-in-out infinite alternate}
.o1{width:520px;height:520px;background:var(--cyan);top:-160px;right:-120px}
.o2{width:460px;height:460px;background:var(--mag);bottom:-180px;left:-120px;animation-delay:-8s}
.o3{width:360px;height:360px;background:var(--vio);top:38%;left:42%;opacity:.35;animation-delay:-14s}
.ring{position:absolute;border:1.5px solid var(--cyan);border-radius:50%;box-shadow:0 0 24px var(--cyan),inset 0 0 24px var(--cyan);opacity:.18}
.r1{width:340px;height:340px;top:12%;left:-90px}.r2{width:200px;height:200px;bottom:8%;right:6%;border-color:var(--mag);box-shadow:0 0 24px var(--mag),inset 0 0 24px var(--mag)}
@keyframes drift{to{transform:translate(60px,40px) scale(1.08)}}
@media (prefers-reduced-motion:reduce){.orb{animation:none}}
.wrap{position:relative;z-index:1;max-width:1240px;margin:0 auto;padding:28px 20px 60px}
header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:26px;flex-wrap:wrap}
.logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:30px;letter-spacing:.32em;direction:ltr;
background:linear-gradient(90deg,var(--cyan),var(--mag));-webkit-background-clip:text;background-clip:text;color:transparent;
filter:drop-shadow(0 0 14px rgba(34,230,255,.45))}
.sub{color:var(--ink2);font-size:14px;margin-top:2px}
.meta{display:flex;gap:10px;align-items:center;color:var(--ink3);font-size:13px}
.btn{color:var(--ink2);border:1px solid var(--line);border-radius:10px;padding:7px 12px;text-decoration:none;font-size:13px}
.btn:hover{border-color:var(--cyan);color:var(--cyan)}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.grid3{display:grid;grid-template-columns:2fr 1fr;gap:14px}
@media (max-width:980px){.grid4{grid-template-columns:repeat(2,1fr)}.grid2,.grid3{grid-template-columns:1fr}}
@media (max-width:520px){.grid4{grid-template-columns:1fr}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px 18px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);position:relative}
.card.glow-c{border-color:rgba(34,230,255,.35);box-shadow:0 0 0 1px rgba(34,230,255,.08),0 0 30px -10px rgba(34,230,255,.5)}
.card.glow-m{border-color:rgba(255,62,200,.35);box-shadow:0 0 0 1px rgba(255,62,200,.08),0 0 30px -10px rgba(255,62,200,.5)}
.sec{margin-top:16px}
h2{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:12px;display:flex;align-items:center;gap:8px}
h2 i{width:8px;height:8px;border-radius:50%;background:var(--cyan);box-shadow:0 0 10px var(--cyan)}
.kpi b{display:block;font-family:'Space Grotesk',sans-serif;font-size:30px;font-weight:700;line-height:1.1;direction:ltr;text-align:right}
.kpi span{color:var(--ink2);font-size:13px}
.c{color:var(--cyan)}.m{color:var(--mag)}.l{color:var(--lime)}.a{color:var(--amber)}
.chan{display:flex;flex-direction:column;gap:10px}
.chan .top{display:flex;justify-content:space-between;align-items:center}
.tag{font-size:12px;border-radius:99px;padding:2px 10px;border:1px solid currentColor}
.chan h3{font-size:20px;font-weight:800}
.row{display:flex;justify-content:space-between;font-size:14px;color:var(--ink2);border-top:1px dashed var(--line);padding-top:8px}
.row b{color:var(--ink);font-weight:600;unicode-bidi:isolate}
.bar{height:8px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}
.bar>div{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--cyan),var(--vio))}
.bar.m>div{background:linear-gradient(90deg,var(--mag),var(--vio))}
.pipe{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.st{font-size:13px;border-radius:10px;padding:7px 10px;border:1px solid var(--line);color:var(--ink3);display:flex;gap:6px;align-items:center}
.st.done{color:var(--lime);border-color:rgba(182,255,59,.35);background:rgba(182,255,59,.06)}
.st.active{color:var(--cyan);border-color:rgba(34,230,255,.5);background:rgba(34,230,255,.08);box-shadow:0 0 16px -4px var(--cyan);animation:pulse 1.8s ease-in-out infinite}
@keyframes pulse{50%{box-shadow:0 0 22px -2px var(--cyan)}}
.vt{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.vt h3{font-size:17px}.vt small{color:var(--ink3)}
ul.q{list-style:none;display:flex;flex-direction:column;gap:8px}
ul.q li{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;padding:9px 10px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line)}
.pri{flex:none;width:9px;height:9px;border-radius:50%;margin-top:6px}
.pri.high{background:var(--mag);box-shadow:0 0 10px var(--mag)}.pri.mid{background:var(--amber)}.pri.low{background:var(--ink3)}
.who{flex:none;font-size:12px;color:var(--ink2);border:1px solid var(--line);border-radius:8px;padding:1px 7px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{color:var(--ink3);font-weight:500;text-align:right;padding:8px 6px;border-bottom:1px solid var(--line)}
td{padding:9px 6px;border-bottom:1px solid var(--line)}
td.n{direction:ltr;text-align:left;font-family:'Space Grotesk',sans-serif}
.topics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
@media (max-width:700px){.topics{grid-template-columns:1fr}}
.tp{direction:ltr;text-align:left;font-size:13.5px;padding:9px 11px;border-radius:12px;border:1px solid var(--line);background:rgba(255,255,255,.02);display:flex;gap:9px}
.tp b{color:var(--ink3);font-family:'Space Grotesk',sans-serif;min-width:20px}
.tp.star{border-color:rgba(255,184,74,.4)}.tp.star b{color:var(--amber)}
.fc{display:flex;flex-direction:column;gap:10px}
.fcr{display:grid;grid-template-columns:80px 1fr 70px;gap:10px;align-items:center;font-size:13px}
.fcr .v{direction:ltr;text-align:left;font-family:'Space Grotesk',sans-serif;color:var(--ink)}
.stack{display:flex;height:12px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.06)}
.stack .s1{background:var(--cyan);box-shadow:0 0 12px var(--cyan)}.stack .s2{background:var(--mag)}
.legend{display:flex;gap:14px;font-size:12px;color:var(--ink2);margin-bottom:10px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-left:5px;vertical-align:-1px}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{font-size:13px;border:1px solid var(--line);border-radius:10px;padding:6px 10px}
.chip b{direction:ltr;display:inline-block;color:var(--cyan);font-weight:600;margin-left:6px}
.empty{color:var(--ink3);font-size:14px}
footer{margin-top:28px;color:var(--ink3);font-size:12px;text-align:center}
/* login */
.login{min-height:100vh;display:grid;place-items:center;position:relative;z-index:1;padding:20px}
.login form{width:100%;max-width:380px;display:flex;flex-direction:column;gap:14px;text-align:center}
.login input{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:12px;padding:13px 14px;color:var(--ink);font-size:16px;font-family:inherit;text-align:center}
.login input:focus{outline:none;border-color:var(--cyan);box-shadow:0 0 18px -4px var(--cyan)}
.login button{border:0;border-radius:12px;padding:13px;font-size:16px;font-weight:700;font-family:inherit;color:#06070c;background:linear-gradient(90deg,var(--cyan),var(--mag));cursor:pointer}
.err{color:var(--mag);font-size:14px}
`;

const BG = `<div class="bg" aria-hidden="true"><div class="grid"></div><div class="orb o1"></div><div class="orb o2"></div><div class="orb o3"></div><div class="ring r1"></div><div class="ring r2"></div></div>`;

// step: 'email' (ask for the address) or 'code' (ask for the code that was just mailed)
function login(step, error) {
  const body = step === 'code'
    ? `<input type="hidden" name="step" value="code">
<div class="sub">אם הכתובת מורשית, נשלח אליה קוד כניסה. הוא תקף ל־10 דקות.</div>
<input name="code" placeholder="קוד מהמייל" autocomplete="one-time-code" autocapitalize="characters" autofocus required style="letter-spacing:.3em">
${error ? '<div class="err">הקוד שגוי או שפג תוקפו</div>' : ''}<button type="submit">כניסה</button>
<a class="btn" href="/castra" style="align-self:center">שליחה מחדש</a>`
    : `<input type="hidden" name="step" value="email">
<input type="email" name="email" placeholder="כתובת מייל" autocomplete="email" autofocus required dir="ltr">
<button type="submit">שליחת קוד כניסה</button>`;
  return `${HEAD('CASTRA')}<body>${BG}<main class="login"><form method="post" action="/castra">
<div class="logo" style="font-size:40px">CASTRA</div><div class="sub">מרכז הבקרה של ערוצי היוטיוב</div>
${body}</form></main></body></html>`;
}

const STAGE_ICON = { done: '✓', active: '●', todo: '○' };

function render(d) {
  const od = d.channels[0], mu = d.channels[1];
  const spent = (d.costs.items || []).reduce((s, x) => s + Number(x.usd || 0), 0);
  const pct = (v, g) => Math.min(100, (v / g) * 100).toFixed(1);
  const maxF = Math.max(...d.forecast.map(f => f.base));
  const chan = (c, glow, cls) => `<div class="card ${glow} chan"><div class="top"><h3>${esc(c.name)}</h3><span class="tag ${cls}">${esc(c.tag)}</span></div>
<div class="sub">${esc(c.status)}</div>
<div class="row"><span>מנויים</span><b dir="ltr">${fmt(c.subs)} / 1,000</b></div><div class="bar ${cls === 'm' ? 'm' : ''}"><div style="width:${pct(c.subs, 1000)}%"></div></div>
<div class="row"><span>שעות צפייה (12 חודשים)</span><b dir="ltr">${fmt(c.hours)} / 8,000</b></div><div class="bar ${cls === 'm' ? 'm' : ''}"><div style="width:${pct(c.hours, 8000)}%"></div></div>
<div class="row"><span>צפיות ב־30 יום</span><b dir="ltr">${fmt(c.views30)}</b></div>
<div class="row"><span>סרטונים שפורסמו</span><b dir="ltr">${fmt(c.videos)}</b></div>
<div class="row"><span>עלות חודשית</span><b dir="ltr">$${c.cost}</b></div><div class="row"><span>RPM צפוי</span><b>${esc(c.rpm)}</b></div></div>`;

  const videos = d.videos.length ? d.videos.map(v => {
    const done = v.stages.filter(s => s.s === 'done').length;
    return `<div class="card sec"><div class="vt"><div><h3>${esc(v.title)}</h3><small>${esc(v.channel)}</small></div>
<span class="tag c">${done}/${v.stages.length} שלבים</span></div><div class="pipe">${v.stages.map(s =>
      `<span class="st ${s.s}">${STAGE_ICON[s.s]} ${esc(s.k)}${s.note ? ` <small>${esc(s.note)}</small>` : ''}</span>`).join('')}</div></div>`;
  }).join('') : '<div class="card sec empty">אין סרטונים בייצור</div>';

  return `${HEAD('CASTRA · מרכז בקרה')}<body>${BG}<div class="wrap">
<header><div><div class="logo">CASTRA</div><div class="sub">מרכז הבקרה של One Decision וערוץ המוזיקה</div></div>
<div class="meta"><span>עודכן ${esc(d.updated)}</span><a class="btn" href="/castra?logout=1">יציאה</a></div></header>

<div class="grid4">
<div class="card kpi glow-c"><b class="c">${fmt(od.views30 + mu.views30)}</b><span>צפיות ב־30 הימים האחרונים</span></div>
<div class="card kpi"><b class="l">${fmt(od.videos + mu.videos)}</b><span>סרטונים שפורסמו</span></div>
<div class="card kpi"><b class="a">$${spent.toFixed(2)}</b><span>הוצאות עד היום</span></div>
<div class="card kpi glow-m"><b class="m">$10,000</b><span>היעד: הכנסה חודשית בחודש 24</span></div>
</div>

<div class="grid2 sec">${chan(od, 'glow-c', 'c')}${chan(mu, 'glow-m', 'm')}</div>

<h2 class="sec" style="margin-top:22px"><i></i>סרטונים בייצור</h2>${videos}

<div class="grid3 sec">
<div class="card"><h2><i style="background:var(--mag);box-shadow:0 0 10px var(--mag)"></i>מחכה לאישור או לפעולה</h2>
${d.approvals.length ? `<ul class="q">${d.approvals.map(a => `<li><span class="pri ${esc(a.pri)}"></span><span style="flex:1">${esc(a.what)}</span><span class="who">${esc(a.who)}</span></li>`).join('')}</ul>` : '<div class="empty">אין משימות פתוחות</div>'}</div>
<div class="card"><h2><i></i>הוצאות</h2>
<table><tbody>${(d.costs.items || []).map(x => `<tr><td>${esc(x.what)}<br><small style="color:var(--ink3)">${esc(x.date)}</small></td><td class="n">$${Number(x.usd).toFixed(2)}</td></tr>`).join('')}
<tr><td><b>סה"כ</b></td><td class="n"><b>$${spent.toFixed(2)}</b></td></tr></tbody></table>
<div class="sub" style="margin-top:10px">תקציב: כ־$15 בחודש, וכ־$70 מחודש 4</div></div>
</div>

<div class="grid2 sec">
<div class="card"><h2><i></i>מסלול היעד</h2><table><thead><tr><th>חודש</th><th>יעד</th><th>בפועל</th></tr></thead><tbody>
${d.milestones.map(m => `<tr><td class="n" style="text-align:right">${m.m}</td><td>${esc(m.goal)}</td><td class="n">${d.launch ? fmt(od.views30) : 'טרם הושק'}</td></tr>`).join('')}</tbody></table>
<div class="sub" style="margin-top:10px">נקודת בדיקה בחודש 12: מתחת ל־150 אלף צפיות בחודש משנים פורמט</div></div>
<div class="card"><h2><i style="background:var(--vio);box-shadow:0 0 10px var(--vio)"></i>צפי הכנסה חודשית, תרחיש בסיס</h2>
<div class="legend"><span><i style="background:var(--cyan)"></i>One Decision</span><span><i style="background:var(--mag)"></i>ערוץ המוזיקה</span></div>
<div class="fc">${d.forecast.map(f => `<div class="fcr"><span>${esc(f.h)}</span><div class="stack" style="width:${(f.base / maxF * 100).toFixed(1)}%"><div class="s1" style="width:${(f.od / f.base * 100).toFixed(1)}%"></div><div class="s2" style="flex:1"></div></div><span class="v">$${fmt(f.base)}</span></div>`).join('')}</div></div>
</div>

<div class="card sec"><h2><i style="background:var(--amber);box-shadow:0 0 10px var(--amber)"></i>נושאים בתור · One Decision</h2>
<div class="topics">${d.topics.map(t => `<div class="tp ${t.star ? 'star' : ''}"><b>${t.n}</b><span>${esc(t.title)}</span></div>`).join('')}</div></div>

<div class="card sec"><h2><i></i>סקילים ומתי משתמשים</h2><div class="chips">${d.skills.map(s => `<span class="chip"><b>${esc(s.k)}</b>${esc(s.when)}</span>`).join('')}</div></div>

<footer>CASTRA · SmartApp · הנתונים מתעדכנים מצינור הייצור</footer>
</div></body></html>`;
}

module.exports = { render, login };
