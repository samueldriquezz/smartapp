// CASTRA admin pages. render(data) -> dashboard HTML, login(error) -> login HTML.
// Data is inlined server side, so nothing about the project is ever served as a public file.

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => Number(n || 0).toLocaleString('en-US');

const HEAD = title => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
<style>${CSS}${CSS2}</style></head>`;

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
.fcr{display:grid;grid-template-columns:150px 1fr 70px;gap:10px;align-items:center;font-size:13px}
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

// CASTRA dashboard + channel pages. Interactivity (collapse, scenario switch, task ticks, countdowns,
// charts) is client side; task ticks and collapsed sections are remembered in this browser.

const money = n => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: Number(n) % 1 ? 2 : 0 });
const heDate = iso => { const [y, m, d] = iso.split('-'); return `${+d}.${+m}.${y}`; };

const CSS2 = `
.brand{text-align:left}
.do{flex:none;border:1px solid rgba(34,230,255,.45);background:rgba(34,230,255,.1);color:var(--cyan);border-radius:8px;padding:3px 12px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.do:hover{background:rgba(34,230,255,.2);box-shadow:0 0 14px -4px var(--cyan)}
li.done .do{display:none}
.modal{position:fixed;inset:0;z-index:20;background:rgba(3,4,8,.7);backdrop-filter:blur(6px);display:grid;place-items:center;padding:16px}
.modal[hidden],.mopt[hidden],.mdone[hidden]{display:none}
.mopt.off{cursor:default;opacity:.5}.mopt.off:hover{border-color:var(--line)}
.mbox{position:relative;width:100%;max-width:440px;background:#0e1020;border:1px solid rgba(34,230,255,.35);border-radius:18px;padding:22px;box-shadow:0 0 40px -10px var(--cyan);display:flex;flex-direction:column;gap:10px}
.mbox h3{font-size:17px;line-height:1.4;padding-left:24px}
.mclose{position:absolute;top:14px;left:14px}
.mopt{display:flex;flex-direction:column;gap:2px;text-align:right;border:1px solid var(--line);background:rgba(255,255,255,.03);color:var(--ink);border-radius:12px;padding:12px 14px;font:inherit;cursor:pointer;text-decoration:none}
.mopt:hover{border-color:var(--cyan)}
.mopt b{font-size:15px}.mopt span{font-size:12.5px;color:var(--ink2)}
#mclaude:hover{border-color:var(--mag)}
.mdone{color:var(--lime);font-size:14px;text-align:center}
details.card>summary{list-style:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px}
details.card>summary::-webkit-details-marker{display:none}
details.card>summary h2{margin:0}
details.card>summary .chev{color:var(--ink2);transition:transform .2s;font-size:20px;line-height:1}
details.card:not([open])>summary .chev{transform:rotate(90deg)}
details.card[open]>summary{margin-bottom:12px}
.seg{display:inline-flex;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.seg button{background:none;border:0;color:var(--ink2);font:inherit;font-size:13px;padding:6px 12px;cursor:pointer}
.seg button.on{background:rgba(34,230,255,.14);color:var(--cyan)}
.hrow{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.hrow h2{margin:0}
.fcr.now .lbl,.ms.now td{color:var(--cyan)}
.fcr .lbl{display:flex;align-items:center;gap:6px}
.here{font-size:11px;color:#06070c;background:var(--cyan);border-radius:99px;padding:1px 8px;box-shadow:0 0 12px var(--cyan);white-space:nowrap}
.timeline{position:relative;margin:30px 14px 22px;height:44px}
.timeline .track{position:absolute;top:18px;left:0;right:0;height:4px;border-radius:99px;background:rgba(255,255,255,.08)}
.timeline .fill{position:absolute;top:18px;right:0;height:4px;border-radius:99px;background:linear-gradient(270deg,var(--cyan),var(--vio));box-shadow:0 0 10px var(--cyan)}
.timeline .pt{position:absolute;top:12px;width:16px;height:16px;margin-right:-8px;border-radius:50%;background:#0d0f19;border:2px solid var(--ink3)}
.timeline .pt.past{border-color:var(--cyan);background:var(--cyan)}
.timeline .pt span{position:absolute;top:22px;right:50%;transform:translateX(50%);font-size:11px;color:var(--ink3);white-space:nowrap}
.timeline .me{position:absolute;top:2px;width:2px;height:36px;margin-right:-1px;background:var(--mag);box-shadow:0 0 12px var(--mag)}
.timeline .me b{position:absolute;bottom:38px;right:50%;transform:translateX(50%);font-size:11px;color:var(--mag);white-space:nowrap;font-weight:600}
ul.q li.done span.t{text-decoration:line-through;color:var(--ink3)}
.tk{flex:none;width:22px;height:22px;border-radius:7px;border:1.5px solid var(--ink3);background:none;cursor:pointer;color:var(--lime);font-size:14px;line-height:1}
li.done .tk{border-color:var(--lime);background:rgba(182,255,59,.12)}
.x{flex:none;background:none;border:0;color:var(--ink3);cursor:pointer;font-size:16px;padding:0 4px}
.x:hover{color:var(--mag)}
.auto{font-size:11px;color:var(--lime);border:1px solid rgba(182,255,59,.35);border-radius:6px;padding:0 6px}
.cost3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.cost3 div{border:1px solid var(--line);border-radius:12px;padding:10px}
.cost3 b{display:block;font-family:'Space Grotesk',sans-serif;font-size:22px;direction:ltr;text-align:right}
.cost3 span{font-size:12px;color:var(--ink2)}
.meter{height:8px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;margin:4px 0 12px}
.meter div{height:100%;background:linear-gradient(90deg,var(--amber),var(--mag))}
.vprog{height:6px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:12px}
.vprog div{height:100%;border-radius:99px;background:linear-gradient(270deg,var(--lime),var(--cyan));box-shadow:0 0 10px var(--cyan)}
.vprog-l{display:flex;justify-content:space-between;font-size:12px;color:var(--ink3);margin-top:6px}
.launch{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.launch b{font-family:'Space Grotesk',sans-serif;font-size:22px}
.go{display:inline-flex;align-items:center;gap:6px;margin-top:4px;color:var(--cyan);text-decoration:none;font-size:14px;font-weight:600}
.card.glow-m .go{color:var(--mag)}
.go:hover{text-decoration:underline}
.charts{display:grid;grid-template-columns:1fr;gap:14px}
.chartbox{position:relative;height:320px}
.note{color:var(--ink3);font-size:13px;margin-top:8px}
`;

const STAGE_ICON = { done: '✓', active: '●', todo: '○' };

function nowIndex(horizons, month) {          // index of the next horizon we are heading to
  const i = horizons.findIndex(h => month < h);
  return i === -1 ? horizons.length - 1 : i;
}

function render(d) {
  const od = d.channels[0], mu = d.channels[1];
  const pct = (v, g) => Math.min(100, (v / g) * 100).toFixed(1);
  const M = d.month_index;
  const fi = nowIndex(d.horizons, M);
  const hLabel = { 6: 'חצי שנה', 12: 'שנה', 18: 'שנה וחצי', 24: 'שנתיים', 36: '3 שנים', 60: '5 שנים' };

  const chan = (c, glow, cls) => `<div class="card ${glow} chan"><div class="top"><h3>${esc(c.name)}</h3><span class="tag ${cls}">${esc(c.tag)}</span></div>
<div class="launch" data-launch="${c.launch}"><span class="sub">השקה</span><b dir="ltr">${heDate(c.launch)}</b><span class="sub cd"></span></div>
${c.status ? `<div class="sub">${esc(c.status)}</div>` : ''}
<div class="row"><span>מנויים</span><b dir="ltr">${fmt(c.subs)} / 1,000</b></div><div class="bar ${cls === 'm' ? 'm' : ''}"><div style="width:${pct(c.subs, 1000)}%"></div></div>
<div class="row"><span>שעות צפייה (12 חודשים)</span><b dir="ltr">${fmt(c.hours)} / 8,000</b></div><div class="bar ${cls === 'm' ? 'm' : ''}"><div style="width:${pct(c.hours, 8000)}%"></div></div>
<div class="row"><span>צפיות ב־30 יום</span><b dir="ltr">${fmt(c.views30)}</b></div>
<div class="row"><span>סרטונים שפורסמו</span><b dir="ltr">${fmt(c.videos)}</b></div>
<div class="row"><span>עלות חודשית</span><b dir="ltr">$${c.cost}</b></div><div class="row"><span>RPM צפוי</span><b>${esc(c.rpm)}</b></div>
<a class="go" href="/castra?ch=${c.key}">לנתונים ולגרפים של הערוץ ←</a></div>`;

  const videos = d.videos.length ? d.videos.map(v => {
    const done = v.stages.filter(s => s.s === 'done').length, p = Math.round(done / v.stages.length * 100);
    return `<div class="card sec"><div class="vt"><div><h3>${esc(v.title)}</h3><small>${esc(v.channel)}</small></div>
<span class="tag c">${done}/${v.stages.length} שלבים</span></div><div class="pipe">${v.stages.map(s =>
      `<span class="st ${s.s}">${STAGE_ICON[s.s]} ${esc(s.k)}${s.note ? ` <small>${esc(s.note)}</small>` : ''}</span>`).join('')}</div>
<div class="vprog"><div style="width:${p}%"></div></div><div class="vprog-l"><span>התקדמות</span><span dir="ltr">${p}%</span></div></div>`;
  }).join('') : '<div class="card sec empty">אין סרטונים בייצור</div>';

  const tasks = `<ul class="q" id="tasks">${d.tasks.map(t => `<li data-id="${esc(t.id)}" data-auto="${t.done ? 1 : 0}" class="${t.done ? 'done' : ''}">
<button class="tk" title="סימון כבוצע">${t.done ? '✓' : ''}</button><span class="pri ${esc(t.pri)}"></span>
<span class="t" style="flex:1">${esc(t.what)}${t.done ? ' <span class="auto">זוהה אוטומטית</span>' : ''}</span>
<span class="who">${esc(t.who)}</span>${(t.link || t.prompt) ? `<button class="do" data-link="${esc(t.link || '')}" data-label="${esc(t.link_label || '')}" data-wait="${esc(t.link_wait || '')}" data-prompt="${esc(t.prompt || '')}" data-what="${esc(t.what)}">בצע</button>` : ''}<button class="x" title="הסרה מהרשימה">✕</button></li>`).join('')}</ul>
<div class="modal" id="modal" hidden><div class="mbox" role="dialog" aria-modal="true" aria-labelledby="mtitle">
<button class="x mclose" title="סגירה">✕</button><h3 id="mtitle"></h3><p class="sub">איך לבצע את המשימה?</p>
<a class="mopt" id="mgo" target="_blank" rel="noopener"><b>מעבר לדף הרלוונטי</b><span id="mgol"></span></a>
<div class="mopt off" id="mwait"><b>מעבר לדף הרלוונטי</b><span id="mwaitl"></span></div>
<button class="mopt" id="mclaude"><b>Claude יבצע עבורי</b><span>הפקודה תועתק, ורק צריך להדביק אותה בשיחה עם Claude Code</span></button>
<div class="mdone" id="mdone" hidden>הפקודה הועתקה. הדבק אותה בשיחה עם Claude Code והוא יבצע.</div></div></div>
<div class="empty" id="tasks-empty" style="display:none">אין משימות פתוחות</div>`;

  const c = d.costs, meterPct = Math.min(100, c.this_month.spent / Math.max(c.this_month.expected, 0.01) * 100);
  const costs = `<div class="cost3"><div><b class="a">${money(c.spent)}</b><span>הוצאנו עד היום</span></div>
<div><b>${money(c.this_month.expected)}</b><span>צפי ל${esc(c.this_month.label)}</span></div>
<div><b>${money(c.next_month.expected)}</b><span>צפי ל${esc(c.next_month.label)}</span></div></div>
<div class="sub">${esc(c.this_month.label)}: נוצלו ${money(c.this_month.spent)} מתוך ${money(c.this_month.expected)}</div>
<div class="meter"><div style="width:${meterPct.toFixed(0)}%"></div></div>
<details class="card" style="padding:12px 14px;background:rgba(255,255,255,.02)"><summary><h2 style="font-size:14px">היסטוריית חיובים (${c.items.length})</h2><span class="chev">▾</span></summary>
<table><tbody>${c.items.slice().reverse().map(x => `<tr><td>${esc(x.what)}<br><small style="color:var(--ink3)">${esc(x.date)}</small></td><td class="n">${money(x.usd)}</td></tr>`).join('')}</tbody></table></details>
<div class="note">תכנון: כ־$15 בחודש מהשקת One Decision, וכ־$70 מהשקת ערוץ המוזיקה</div>`;

  const scen = sc => d.horizons.map((h, i) => {
    const o = d.forecast[sc].od[i], m = d.forecast[sc].music[i], tot = o + m;
    return { h, o, m, tot };
  });
  const fcRows = sc => { const rows = scen(sc), max = Math.max(...rows.map(r => r.tot)) || 1;
    return rows.map((r, i) => `<div class="fcr ${i === fi ? 'now' : ''}"><span class="lbl">${hLabel[r.h]}${i === fi ? ' <span class="here">היעד הבא</span>' : ''}</span>
<div class="stack" style="width:${(r.tot / max * 100).toFixed(1)}%">${r.tot ? `<div class="s1" style="width:${(r.o / r.tot * 100).toFixed(1)}%"></div><div class="s2" style="flex:1"></div>` : ''}</div><span class="v">${money(r.tot)}</span></div>`).join(''); };

  const tl = (marks, labelFn) => {      // horizontal timeline with a "we are here" marker (RTL: starts on the right)
    const max = marks[marks.length - 1], pos = m => (m / max * 100).toFixed(2);
    return `<div class="timeline"><div class="track"></div><div class="fill" style="width:${pos(Math.min(M, max))}%"></div>
${[0, ...marks].map(m => `<div class="pt ${M >= m ? 'past' : ''}" style="right:${pos(m)}%"><span>${labelFn(m)}</span></div>`).join('')}
<div class="me" style="right:${pos(Math.min(M, max))}%"><b>${M ? `חודש ${M}` : 'לפני השקה'}</b></div></div>`;
  };

  const milestones = `${tl(d.milestones.map(m => m.m), m => m ? `חודש ${m}` : 'השקה')}
<table><thead><tr><th>חודש</th><th>יעד</th><th>בפועל</th></tr></thead><tbody>
${d.milestones.map((m, i) => { const now = i === nowIndex(d.milestones.map(x => x.m), M);
    return `<tr class="ms ${now ? 'now' : ''}"><td class="n" style="text-align:right">${m.m}${now ? ' <span class="here">היעד הבא</span>' : ''}</td><td>${esc(m.goal)}</td><td class="n">${M ? fmt(od.views30) : 'טרם הושק'}</td></tr>`; }).join('')}</tbody></table>
<div class="note">נקודת בדיקה בחודש 12: מתחת ל־150 אלף צפיות בחודש משנים פורמט</div>`;

  return `${HEAD('CASTRA · מרכז בקרה')}<body>${BG}<div class="wrap">
<header><div class="meta"><span>עודכן ${esc(d.updated)}</span><a class="btn" href="/castra?logout=1">יציאה</a></div>
<div class="brand"><div class="logo">CASTRA</div><div class="sub">מרכז הבקרה של One Decision וערוץ המוזיקה</div></div></header>

<div class="grid4">
<div class="card kpi glow-c"><b class="c">${fmt(od.views30 + mu.views30)}</b><span>צפיות ב־30 הימים האחרונים</span></div>
<div class="card kpi"><b class="l">${fmt(od.videos + mu.videos)}</b><span>סרטונים שפורסמו</span></div>
<div class="card kpi"><b class="a">${money(c.spent)}</b><span>הוצאות עד היום</span></div>
<div class="card kpi glow-m"><b class="m">$10,000</b><span>היעד: הכנסה חודשית בחודש 24</span></div>
</div>

<div class="grid2 sec">${chan(od, 'glow-c', 'c')}${chan(mu, 'glow-m', 'm')}</div>

<h2 class="sec" style="margin-top:22px"><i></i>סרטונים בייצור</h2>${videos}

<div class="grid3 sec">
<div class="card"><h2><i style="background:var(--mag);box-shadow:0 0 10px var(--mag)"></i>משימות להמשך</h2>${tasks}</div>
<div class="card"><h2><i style="background:var(--amber);box-shadow:0 0 10px var(--amber)"></i>הוצאות</h2>${costs}</div>
</div>

<div class="grid2 sec">
<details class="card" data-k="ms" open><summary><h2><i></i>מסלול היעד</h2><span class="chev">▾</span></summary>${milestones}</details>
<details class="card" data-k="fc" open><summary><h2><i style="background:var(--vio);box-shadow:0 0 10px var(--vio)"></i>צפי הכנסה חודשית</h2><span class="chev">▾</span></summary>
<div class="hrow"><div class="legend" style="margin:0"><span><i style="background:var(--cyan)"></i>One Decision</span><span><i style="background:var(--mag)"></i>ערוץ המוזיקה</span></div>
<div class="seg" id="scen"><button data-s="base" class="on">בסיס</button><button data-s="opt">אופטימי</button></div></div>
${tl(d.horizons, m => m ? hLabel[m] : 'השקה')}
<div class="fc" data-s="base">${fcRows('base')}</div><div class="fc" data-s="opt" style="display:none">${fcRows('opt')}</div></details>
</div>

<details class="card sec" data-k="topics"><summary><h2><i style="background:var(--amber);box-shadow:0 0 10px var(--amber)"></i>נושאים בתור · One Decision (${d.topics.length})</h2><span class="chev">▾</span></summary>
<div class="topics">${d.topics.map(t => `<div class="tp ${t.star ? 'star' : ''}"><b>${t.n}</b><span>${esc(t.title)}</span></div>`).join('')}</div></details>

<details class="card sec" data-k="skills"><summary><h2><i></i>סקילים ומתי משתמשים</h2><span class="chev">▾</span></summary><div class="chips">${d.skills.map(s => `<span class="chip"><b>${esc(s.k)}</b>${esc(s.when)}</span>`).join('')}</div></details>

<footer>CASTRA · SmartApp · הנתונים מתעדכנים מצינור הייצור</footer>
</div>${CLIENT}</body></html>`;
}

const CLIENT = `<script>
(function(){
  var ls={get:function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
          set:function(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  // collapsible sections remember their state
  var open=ls.get('castra.open',{});
  document.querySelectorAll('details[data-k]').forEach(function(el){
    var k=el.dataset.k; if(k in open) el.open=open[k];
    el.addEventListener('toggle',function(){open[k]=el.open;ls.set('castra.open',open)});
  });
  // countdown to each launch
  document.querySelectorAll('[data-launch]').forEach(function(el){
    var days=Math.ceil((new Date(el.dataset.launch+'T00:00:00')-new Date())/864e5), cd=el.querySelector('.cd');
    cd.textContent= days>0 ? 'עוד '+days+' ימים' : (days===0 ? 'היום!' : 'פעיל '+(-days)+' ימים');
  });
  // scenario switch
  var seg=document.getElementById('scen');
  if(seg) seg.addEventListener('click',function(e){var s=e.target.dataset.s;if(!s)return;
    seg.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',b.dataset.s===s)});
    document.querySelectorAll('.fc[data-s]').forEach(function(f){f.style.display=f.dataset.s===s?'':'none'})});
  // tasks: tick = done, x = remove from the list (both remembered in this browser)
  var st=ls.get('castra.tasks',{done:{},gone:{}}), list=document.getElementById('tasks');
  function paint(){ if(!list) return; var left=0;
    list.querySelectorAll('li').forEach(function(li){var id=li.dataset.id, done=li.dataset.auto==='1'||st.done[id];
      li.classList.toggle('done',!!done); li.querySelector('.tk').textContent=done?'✓':'';
      li.style.display=st.gone[id]?'none':''; if(!st.gone[id]) left++;});
    document.getElementById('tasks-empty').style.display=left?'none':''; }
  if(list) list.addEventListener('click',function(e){var li=e.target.closest('li'); if(!li) return; var id=li.dataset.id;
    if(e.target.classList.contains('tk')){ if(li.dataset.auto!=='1'){st.done[id]=!st.done[id]} }
    else if(e.target.classList.contains('x')){ st.gone[id]=true }
    else return; ls.set('castra.tasks',st); paint(); });
  paint();
  // "בצע": a popup that either opens the relevant page or copies a ready command for Claude Code
  var modal=document.getElementById('modal');
  if(modal){
    document.body.appendChild(modal);   // backdrop-filter on the card would trap a fixed popup inside it
    var go=document.getElementById('mgo'), cl=document.getElementById('mclaude'), done=document.getElementById('mdone'), prompt='';
    function close(){modal.hidden=true}
    list.addEventListener('click',function(e){var b=e.target.closest('.do'); if(!b) return; e.stopPropagation();
      document.getElementById('mtitle').textContent=b.dataset.what; prompt=b.dataset.prompt;
      go.hidden=!b.dataset.link; if(b.dataset.link){go.href=b.dataset.link; document.getElementById('mgol').textContent=b.dataset.label||b.dataset.link}
      var w=document.getElementById('mwait'); w.hidden=!!b.dataset.link||!b.dataset.wait; document.getElementById('mwaitl').textContent=b.dataset.wait;
      cl.hidden=!prompt; done.hidden=true; modal.hidden=false;});
    cl.addEventListener('click',function(){
      var ok=function(){done.hidden=false};
      if(navigator.clipboard) navigator.clipboard.writeText(prompt).then(ok,function(){window.prompt('העתק את הפקודה:',prompt)});
      else window.prompt('העתק את הפקודה:',prompt);});
    modal.addEventListener('click',function(e){if(e.target===modal||e.target.classList.contains('mclose'))close()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  }
})();
</script>`;

// ---------------------------------------------------------------- channel page
function targetSeries(key, launchIso, days) {
  // planned daily views from the milestone path (months since this channel's launch -> monthly views)
  const pts = key === 'od' ? [[0, 0], [6, 50000], [12, 300000], [18, 800000], [24, 1200000]]
                           : [[0, 0], [3, 10000], [9, 60000], [15, 120000], [21, 200000]];
  const at = m => { for (let i = 1; i < pts.length; i++) if (m <= pts[i][0]) {
      const [m0, v0] = pts[i - 1], [m1, v1] = pts[i]; return v0 + (v1 - v0) * (m - m0) / (m1 - m0); }
    return pts[pts.length - 1][1]; };
  const start = new Date(launchIso + 'T00:00:00Z');
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(start.getTime() + i * 864e5);
    return { date: day.toISOString().slice(0, 10), views: Math.round(at(i / 30.4) / 30.4) };
  });
}

function renderChannel(d, key) {
  const c = d.channels.find(x => x.key === key);
  if (!c) return null;
  const cls = key === 'od' ? 'c' : 'm';
  const target = targetSeries(key, c.launch, 120);
  const series = c.series || [];
  const rev30 = series.slice(-30).reduce((s, x) => s + (x.revenue || 0), 0);
  return `${HEAD('CASTRA · ' + c.name)}<body>${BG}<div class="wrap">
<header><div class="meta"><a class="btn" href="/castra">→ חזרה לדשבורד</a><a class="btn" href="/castra?logout=1">יציאה</a></div>
<div class="brand"><div class="logo">CASTRA</div><div class="sub">${esc(c.name)} · נתונים לאורך זמן</div></div></header>

<div class="grid4">
<div class="card kpi ${key === 'od' ? 'glow-c' : 'glow-m'}"><b class="${cls}">${fmt(c.views30)}</b><span>צפיות ב־30 יום</span></div>
<div class="card kpi"><b>${fmt(c.subs)}</b><span>מנויים (יעד 1,000)</span></div>
<div class="card kpi"><b>${fmt(c.hours)}</b><span>שעות צפייה (יעד 8,000)</span></div>
<div class="card kpi"><b class="l">${money(rev30)}</b><span>הכנסה ב־30 יום</span></div>
</div>

<div class="card sec"><div class="launch" data-launch="${c.launch}"><span class="sub">השקה</span><b dir="ltr">${heDate(c.launch)}</b><span class="sub cd"></span></div>
${series.length ? '' : `<div class="note">עדיין אין נתונים מיוטיוב. הגרפים יתמלאו מיום ההשקה, אחרי חיבור YouTube Analytics. בינתיים מוצג קו היעד.</div>`}</div>

<div class="hrow sec" style="margin-top:18px"><h2 style="margin:0"><i></i>גרפים</h2>
<div class="seg" id="range"><button data-d="7">שבוע</button><button data-d="30" class="on">חודש</button><button data-d="90">3 חודשים</button></div></div>
<div class="charts">
<div class="card"><h2>צפיות ביום · בפועל מול יעד</h2><div class="chartbox"><canvas id="c1"></canvas></div></div>
<div class="card"><h2>מנויים, שעות צפייה והכנסה מצטברים</h2><div class="chartbox"><canvas id="c2"></canvas></div></div>
</div>
<footer>CASTRA · SmartApp</footer></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
(function(){
  var series=${JSON.stringify(series)}, target=${JSON.stringify(target)}, launch='${c.launch}', main='${key === 'od' ? '#22e6ff' : '#ff3ec8'}';
  var el=document.querySelector('[data-launch]'), days=Math.ceil((new Date(launch+'T00:00:00')-new Date())/864e5);
  el.querySelector('.cd').textContent= days>0 ? 'עוד '+days+' ימים' : (days===0 ? 'היום!' : 'פעיל '+(-days)+' ימים');
  Chart.defaults.color='#a3a8c3'; Chart.defaults.font.family='Heebo'; Chart.defaults.borderColor='rgba(255,255,255,.06)';
  function windowOf(n){ // last n days up to today, or the first n days from launch before launch
    var today=new Date().toISOString().slice(0,10), end=today<launch ? null : today, out=[];
    var start = end ? new Date(new Date(end+'T00:00:00Z').getTime()-(n-1)*864e5) : new Date(launch+'T00:00:00Z');
    for(var i=0;i<n;i++) out.push(new Date(start.getTime()+i*864e5).toISOString().slice(0,10));
    return out; }
  var byDate={}; series.forEach(function(x){byDate[x.date]=x}); var tByDate={}; target.forEach(function(x){tByDate[x.date]=x.views});
  var c1,c2;
  function draw(n){
    var ds=windowOf(n), labels=ds.map(function(d){var p=d.split('-');return +p[2]+'.'+(+p[1])});
    var actual=ds.map(function(d){return byDate[d]?byDate[d].views:null});
    var tgt=ds.map(function(d){return d in tByDate?tByDate[d]:null});
    var cum=function(k){var s=0;return ds.map(function(d){if(!byDate[d])return null;s+=byDate[d][k]||0;return s})};
    if(c1)c1.destroy(); if(c2)c2.destroy();
    c1=new Chart(document.getElementById('c1'),{type:'line',data:{labels:labels,datasets:[
      {label:'בפועל',data:actual,borderColor:main,backgroundColor:main+'22',fill:true,tension:.35,pointRadius:0,spanGaps:true},
      {label:'יעד',data:tgt,borderColor:'#8b5cf6',borderDash:[6,5],pointRadius:0,tension:.35}]},
      options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},scales:{y:{beginAtZero:true}}}});
    c2=new Chart(document.getElementById('c2'),{type:'line',data:{labels:labels,datasets:[
      {label:'מנויים',data:cum('subs'),borderColor:main,pointRadius:0,tension:.35,yAxisID:'y'},
      {label:'שעות צפייה',data:cum('hours'),borderColor:'#b6ff3b',pointRadius:0,tension:.35,yAxisID:'y'},
      {label:'הכנסה ($)',data:cum('revenue'),borderColor:'#ffb84a',pointRadius:0,tension:.35,yAxisID:'y1'}]},
      options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
        scales:{y:{beginAtZero:true},y1:{beginAtZero:true,position:'right',grid:{drawOnChartArea:false}}}}});
  }
  var seg=document.getElementById('range');
  seg.addEventListener('click',function(e){var n=+e.target.dataset.d;if(!n)return;
    seg.querySelectorAll('button').forEach(function(b){b.classList.toggle('on',+b.dataset.d===n)}); draw(n)});
  draw(30);
})();
</script></body></html>`;
}

module.exports = { render, renderChannel, login };
