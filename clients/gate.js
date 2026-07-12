// gate.js — v7 | tag-based personalized content + insurance tab

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDTXhB6W_xNLW644t7hdzjGmMtU_7rsLoVNTxD9B_9No5OJ-QW3hXdzkutSxuYSI46/exec';
const AUTH_TOKEN      = 'pensya-ira-2024';
const CONTENT_BASE    = '/clients/content/tag-';

const KNOWN_TAGS = [
  { id: 8,  name: 'IRA' },
  { id: 10, name: 'תיק השקעות' }
];

// תאריך העדכון האחרון שמוצג מתחת לכל טאב — נפרד לכל לשונית.
// כשמעדכנים תוכן בלשונית מסוימת, משנים כאן רק את התאריך שלה. השאר נשארים כמו שהם.
var TAB_DATES = {
  'פנסיה והשתלמות': '12.7.2026',
  'IRA':             '12.7.2026',
  'ביטוחים':         '12.7.2026',
  'תיק השקעות':      '12.7.2026',
  'זיכוי על תרומות': '12.7.2026'
};
// ברירת מחדל ללשונית שלא מופיעה במפה למעלה
var DEFAULT_TAB_UPDATED = '12.7.2026';

function normalizePhone(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) digits = '0' + digits.slice(3);
  return digits;
}

const gateSection    = document.getElementById('gate-section');
const contentSection = document.getElementById('content-section');
const contentFooter  = document.getElementById('content-footer');
const submitBtn      = document.getElementById('submit-btn');
const btnText        = document.getElementById('btn-text');
const errorDiv       = document.getElementById('error-msg');

function showError(msg) { errorDiv.textContent = msg; errorDiv.style.display = 'block'; }
function clearError()   { errorDiv.style.display = 'none'; }
function setLoading(on) {
  submitBtn.disabled = on;
  btnText.innerHTML  = on ? '<span class="spinner"></span>' : 'כניסה';
}

function buildUI(sections, name) {
  gateSection.style.display    = 'none';
  contentSection.style.display = 'block';
  contentFooter.style.display  = 'block';

  const headerBar = document.getElementById('content-header-bar');
  const panelsDiv = document.getElementById('tab-panels');

  if (!sections || sections.length === 0) {
    headerBar.innerHTML = buildWelcomeBar(name);
    panelsDiv.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#666;">אין תוכן זמין כרגע. לשאלות — פנה לאיתן ישירות.</div>';
    wireLogout();
    return;
  }

  if (sections.length === 1) {
    headerBar.innerHTML = buildWelcomeBar(name);
    panelsDiv.innerHTML = '';
    var only = document.createElement('div');
    only.className = 'tab-panel tab-panel-active';
    only.setAttribute('data-idx', 0);
    only.innerHTML = sections[0].html;
    panelsDiv.appendChild(only);
    wireLogout();
    return;
  }

  var tabBtns = sections.map(function(s, i) {
    var upd = s.updated || TAB_DATES[s.tagName] || DEFAULT_TAB_UPDATED;
    return '<button class="tab-btn' + (i === 0 ? ' tab-active' : '') + '" data-idx="' + i + '">' +
      '<span class="tab-btn-name">' + s.tagName + '</span>' +
      '<span class="tab-btn-date">עודכן ' + upd + '</span>' +
      '</button>';
  }).join('');

  headerBar.innerHTML = buildWelcomeBar(name) +
    '<nav class="tab-bar"><div class="container tab-bar-inner">' + tabBtns + '</div></nav>';

  panelsDiv.innerHTML = '';
  sections.forEach(function(s, i) {
    var panel = document.createElement('div');
    panel.className = 'tab-panel' + (i === 0 ? ' tab-panel-active' : '');
    panel.setAttribute('data-idx', i);
    panel.innerHTML = s.html;   // innerHTML מבודד לכל פאנל — תגית לא סגורה בפאנל אחד לא "בולעת" את הבא
    panelsDiv.appendChild(panel);
  });

  headerBar.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var idx = btn.dataset.idx;
      headerBar.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('tab-active'); });
      panelsDiv.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('tab-panel-active'); });
      btn.classList.add('tab-active');
      panelsDiv.querySelector('.tab-panel[data-idx="' + idx + '"]').classList.add('tab-panel-active');
    });
  });

  wireLogout();
}

function buildWelcomeBar(name) {
  return '<div class="content-hero"><div class="container">' +
    '<p class="welcome-note">שלום, <strong class="welcome-name">' + name + '</strong></p>' +
    '<span class="logout-link" id="logout-btn">יציאה מהחשבון</span>' +
    '</div></div>';
}

function wireLogout() {
  document.getElementById('logout-btn').addEventListener('click', function() {
    sessionStorage.removeItem('pensya_client_auth');
    location.reload();
  });
}

// מזהי תגיות שיש להם דף תוכן בפועל
const CONTENT_TAG_IDS = [8, 10, 11];

function fetchTagHtml(tagId) {
  if (CONTENT_TAG_IDS.indexOf(tagId) === -1) return Promise.resolve(null);
  return fetch(CONTENT_BASE + tagId)
    .then(function(res) { return res.ok ? res.text() : null; })
    .catch(function() { return null; });
}

var PROMO_HTML =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · הזדמנות</div>' +
  '<h1>רצית לפתוח תיק השקעות?</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream);padding:48px 0 64px;">' +
  '<div class="container">' +
  '<div class="intro-note" style="max-width:620px;margin:0 auto;text-align:center;">' +
  '<p style="font-size:17px;line-height:1.8;margin-bottom:24px;">' +
  'תיק השקעות המושקע במפוזר במניות הוא דרך מצוינת להצמיח את הכסף.<br>' +
  'אם אתה חושש לפתוח תיק השקעות לבד ומעוניין ביד מנחה שתוביל אותך לבנות תיק מנייתי מפוזר — ' +
  '<strong>אתה מוזמן לפנות אלינו.</strong>' +
  '</p>' +
  '<p style="font-size:14px;color:var(--text-meta);margin-bottom:32px;">השירות כרוך בתשלום</p>' +
  '<a href="https://wa.me/972527700599" style="display:inline-block;background:var(--primary);color:#fff;' +
  'padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">' +
  '💬 דברו איתנו בוואטסאפ' +
  '</a>' +
  '</div></div></div>';

var PROMO_SECTION = { tagName: 'פתיחת תיק השקעות', html: PROMO_HTML };

// טאב זיכוי על תרומות — מוצג לכל הלקוחות
var DONATIONS_HTML =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · זכויות מס</div>' +
  '<h1>זיכוי במס על תרומות</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream);padding:40px 0 60px;">' +
  '<div class="container">' +
  '<div class="intro-note" style="max-width:720px;margin:0 auto;font-size:19px;line-height:1.9;">' +
  'אם אתה שכיר ותרמת לעמותות שיש להן אישור לפי <strong>סעיף 46</strong>, ' +
  'מגיע לך זיכוי במס על התרומה. במקום להגיש בקשה להחזר מס בסוף השנה, אפשר להגדיר באזור האישי ' +
  'באתר רשות המיסים מיהו המעסיק שלך — וכך הזיכוי על התרומה ייכנס <strong>אוטומטית לתלוש השכר</strong> שלך.<br><br>' +
  'למידע נוסף באתר רשות המיסים: ' +
  '<a href="https://www.gov.il/he/pages/tax-credit-for-donations-to-individuals" target="_blank" rel="noopener" ' +
  'style="color:var(--primary);font-weight:600;">זיכוי ממס בגין תרומות</a>.' +
  '</div>' +
  '<div class="intro-note" style="max-width:720px;margin:20px auto 0;font-size:19px;line-height:1.9;">' +
  'הקובץ המצורף מסביר שלב אחר שלב איך לעשות את זה.' +
  '</div>' +
  '<div style="max-width:900px;margin:32px auto 0;">' +
  '<object data="/clients/files/zikui-trumot.pdf#navpanes=0&view=FitH" type="application/pdf" ' +
  'style="width:100%;height:720px;border:1px solid #e0dccf;border-radius:8px;">' +
  '<p style="text-align:center;padding:20px;color:var(--text-meta);">' +
  'לא ניתן להציג את הקובץ כאן — ' +
  '<a href="/clients/files/zikui-trumot.pdf" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">לחץ לפתיחת המדריך</a>.' +
  '</p></object>' +
  '</div>' +
  '<div style="text-align:center;margin:24px auto 0;">' +
  '<a href="/clients/files/zikui-trumot.pdf" download ' +
  'style="display:inline-block;background:var(--primary);color:#fff;padding:14px 32px;' +
  'border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">' +
  '⬇️ להורדה' +
  '</a>' +
  '</div>' +
  '</div></div>';

var DONATIONS_SECTION = { tagName: 'זיכוי על תרומות', html: DONATIONS_HTML };

// טאב ביטוחים — מוצג לכל הלקוחות. תוכן מפורט למי שיש תגית "תכנון פיננסי" (#11), אחרת הודעה כללית.
var INSURANCE_HTML_PLANNING =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · המלצות אישיות</div>' +
  '<h1>ביטוחים</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream);padding:40px 0 60px;">' +
  '<div class="container">' +
  '<div style="display:flex;flex-direction:column;gap:24px;max-width:680px;margin:0 auto;">' +
    '<div class="portfolio-card" style="padding:28px 32px;">' +
    '<div class="portfolio-name" style="font-size:18px;margin-bottom:12px;">ביטוח תרופות</div>' +
    '<p style="margin:0;font-size:15px;line-height:1.8;color:var(--text-secondary);">' +
    'ההמלצה שלי היא לעשות <strong>אך ורק ביטוח תרופות שלא בסל</strong>, ולעשות את הביטוח הזה ב-<strong>AIG</strong> — ' +
    'מכיוון שהיא הכי זולה (אין הבדל בפוליסה; כל החברות מוכרות בדיוק את אותם הכיסויים), ולפי דירוג משרד האוצר היא בעלת השירות הטוב ביותר.' +
    '</p></div>' +
    '<div class="portfolio-card" style="padding:28px 32px;">' +
    '<div class="portfolio-name" style="font-size:18px;margin-bottom:12px;">ביטוח סיעודי</div>' +
    '<p style="margin:0;font-size:15px;line-height:1.8;color:var(--text-secondary);">' +
    'אני עדיין מעריך שהביטוח הסיעודי של קופות החולים יתבטל במוקדם או במאוחר, ויחליף אותו מודל אחר. ' +
    'לדעתי, עבור אנשים בריאים וצעירים זה עשוי להתברר כבזבוז.' +
    '</p></div>' +
    '<div class="portfolio-card" style="padding:28px 32px;">' +
    '<div class="portfolio-name" style="font-size:18px;margin-bottom:12px;">ביטוח חיים</div>' +
    '<p style="margin:0;font-size:15px;line-height:1.8;color:var(--text-secondary);">' +
    'אם עשיתם ביטוח חיים לפני יותר משנתיים-שלוש — מומלץ להחליף את הפוליסה בפוליסה חדשה או לחדש הנחות. ' +
    'זה צפוי לחסוך <strong>עשרות אחוזים</strong> מהתשלום!<br><br>' +
    'אם לא אמרתי לכם אחרת — אין לכם צורך בביטוח חיים מעבר למה שנדרש עבור המשכנתא.' +
    '</p></div>' +
  '</div></div></div>';

var INSURANCE_HTML_DEFAULT =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · ביטוחים</div>' +
  '<h1>ביטוחים</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream);padding:44px 0 64px;">' +
  '<div class="container">' +
  '<style>' +
  '.ins-collage{max-width:780px;margin:0 auto 8px;}' +
  '.ins-collage-cap{text-align:center;font-size:14px;color:var(--text-meta);margin-bottom:16px;}' +
  '.ins-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}' +
  '.ins-card{border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.12);padding:22px 20px;text-align:center;overflow:hidden;}' +
  '.ins-scribble{font-weight:800;text-decoration:underline wavy #e23b2f;text-decoration-thickness:2px;text-underline-offset:3px;}' +
  '@media(max-width:560px){.ins-grid{grid-template-columns:1fr;}}' +
  '</style>' +
  '<div class="ins-collage">' +
  '<div class="ins-collage-cap">בטח כבר ראית פרסומות כאלה...</div>' +
  '<div class="ins-grid">' +
  '<div class="ins-card" style="background:#ffffff;border:1px solid #e4e1dc;">' +
  '<div style="font-size:17px;font-weight:800;color:#1A1A2E;margin-bottom:10px;">מבולבלים מכל הביטוחים שיש לכם?</div>' +
  '<div style="font-size:15px;color:#1A1A2E;margin-bottom:12px;">קבלו בדיקה של תיק הביטוח <span class="ins-scribble">בחינם!</span></div>' +
  '<div style="font-size:21px;font-weight:800;color:#1A1A2E;">גם מכוסים וגם חוסכים!</div>' +
  '</div>' +
  '<div class="ins-card" style="background:#eef4fb;border:1px solid #dce6f2;">' +
  '<div style="font-size:14px;font-weight:800;color:#2f6bb0;line-height:1.65;margin-bottom:14px;">לשירות ללא עלות של חיסכון משמעותי בביטוח ואיתור כפל ביטוחים – מלאו את הטופס</div>' +
  '<div style="border-top:1px solid #cdd8e6;padding-top:12px;font-size:14px;color:#7089a3;">בדיקה מקיפה בחינם ללקוחות <span style="border-bottom:3px solid #46c02a;padding-bottom:1px;">כל חברות הביטוח</span></div>' +
  '</div>' +
  '<div class="ins-card" style="background:#eef3fb;border:1px solid #dce6f2;">' +
  '<div style="font-size:16px;font-weight:800;color:#2f5fae;margin-bottom:8px;">הר הביטוח – הפקת דוח ובדיקה מקיפה</div>' +
  '<div style="font-size:14px;font-weight:700;color:#1A1A2E;margin-bottom:10px;">באמצעות <span style="display:inline-block;background:#1A1A2E;border-radius:4px;width:58px;height:11px;vertical-align:middle;"></span> סוכנות ביטוח מורשית</div>' +
  '<div style="font-size:12.5px;color:#5a6b82;line-height:1.65;">בתוך כמה רגעים תקבלו דוח מפורט על הביטוחים שלכם ותוכלו לבצע הוזלת מחירים, למנוע כפילויות ולעשות סדר ביטוחי. אז שנתחיל? <span class="ins-scribble">הבדיקה בחינם!</span></div>' +
  '</div>' +
  '<div class="ins-card" style="background:#241f47;">' +
  '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px;">משלמים כפול על הביטוח?</div>' +
  '<div style="font-size:15px;font-weight:800;color:#fff;border-bottom:2px solid rgba(255,255,255,.45);display:inline-block;padding-bottom:2px;margin-bottom:12px;">הגיע הזמן לעשות סדר בתיק ולגלות כפל ביטוחים!</div>' +
  '<div style="font-size:12.5px;color:#c7c3dd;line-height:1.65;margin-bottom:14px;">זה לא סוד, רוב הישראלים משלמים אלפי שקלים בשנה על ביטוחים מיותרים או כפולים, בלי לדעת מה קורה בתיק הביטוחי ובלי לדעת מה מקבלים.</div>' +
  '<span style="display:inline-block;background:#f4d35e;color:#241f47;font-weight:800;font-size:13px;padding:9px 22px;border-radius:24px;">לבדיקה בחינם השאירו פרטים »</span>' +
  '</div>' +
  '</div>' +
  '</div>' +
  '<div class="intro-note" style="max-width:640px;margin:36px auto 0;font-size:17px;line-height:1.9;">' +
  '<p style="font-size:23px;font-weight:800;color:var(--primary);margin-bottom:18px;text-align:center;">"בדיקת ביטוחים בחינם"</p>' +
  '<p style="margin-bottom:16px;">בטח נתקלת בפרסום של שירות כזה עשרות פעמים לפחות.</p>' +
  '<p style="margin-bottom:16px;">תחשוב שאתה דג, ואתה רואה על שפת הנחל שני אנשים.<br>' +
  'האחד מחזיק ברישיון \'אופה\', והוא מוכר לדגים את הלחם. השני מחלק לדגים לחם <strong>בחינם</strong>. ' +
  'המודל העסקי שלו הוא לקבל כסף ממסעדות דגים... בכיס יש לו רישיון סוכן — אבל אתה מבין למי הוא מוכר.</p>' +
  '<p style="margin-bottom:16px;">וכבר הבנת שעל ביטוח אסור להתייעץ עם מי שירוויח יותר אם תקנה יותר ביטוחים. ' +
  'גם החוק מבין את זה — ואוסר עליו לייעץ. הוא איש מכירות.</p>' +
  '<p style="margin-bottom:0;">ואם אתה לא רוצה שימכרו אותך למסעדת דגים — בוא לייעוץ. ' +
  'שלם על הלחם, ותהיה רגוע שלא מכרו אותך.</p>' +
  '</div>' +
  '<div style="text-align:center;margin:32px auto 0;">' +
  '<a href="https://wa.me/972527700599" style="display:inline-block;background:#25D366;color:#fff;' +
  'padding:14px 34px;border-radius:8px;font-weight:700;font-size:16px;text-decoration:none;">' +
  '💬 פנה אלינו בוואטסאפ' +
  '</a>' +
  '</div>' +
  '</div></div>';

function buildInsuranceSection(hasTag11) {
  return { tagName: 'ביטוחים', html: hasTag11 ? INSURANCE_HTML_PLANNING : INSURANCE_HTML_DEFAULT };
}

// ====== עדכון המלצה: מניות ישראליות ======
// באנר שמוצמד לראש לשונית ההשקעה/פנסיה הרלוונטית למי שקיבל בעבר המלצה על מניות ישראליות (#8 / #10 / #11)
var ISRAELI_NOTICE_BANNER =
  '<div style="background:#FBEEEA;border-bottom:3px solid var(--accent,#D74E3C);padding:22px 0;">' +
  '<div class="container"><div style="max-width:900px;margin:0 auto;">' +
  '<div style="font-size:17px;font-weight:800;color:#B23A28;margin-bottom:10px;">⚠ עדכון המלצה — מניות ישראליות</div>' +
  '<p style="margin:0 0 10px;font-size:15px;line-height:1.8;color:#333;">בעבר המלצתי על השקעה במניות ישראליות. <strong>היום ההמלצה השתנתה</strong> — אני ממליץ <strong>שלא להשקיע</strong> בקרנות ובמסלולים שמשקיעים במניות ישראליות:</p>' +
  '<ol style="margin:0;padding-inline-start:20px;font-size:15px;line-height:1.8;color:#333;">' +
  '<li>מכפיל הרווח שלהן גבוה מדי — פגיעה בפוטנציאל התשואה העתידי וכן גורם סיכון.</li>' +
  '<li>מצב הנדל"ן בארץ בעייתי מאוד, ומשבר בענף הזה יקרין גם על ענפים אחרים.</li>' +
  '<li>התחזקות הדולר תפגע בחברות יצואניות.</li>' +
  '</ol></div></div></div>';

// לשונית "תיק השקעות" עצמאית למי שהתייעץ על ני"ע בלבד (#2) — ההודעה בלבד, ללא תיק מומלץ
var ISRAELI_NOTICE_TAB =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · תיק השקעות</div>' +
  '<h1>תיק השקעות</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream,#F8F6F3);padding:40px 0 60px;"><div class="container">' +
  '<div class="portfolio-card" style="padding:28px 32px;border-right:4px solid var(--accent,#D74E3C);max-width:720px;margin:0 auto;">' +
  '<div style="font-size:18px;font-weight:800;color:#B23A28;margin-bottom:14px;">עדכון המלצה — מניות ישראליות</div>' +
  '<p style="margin:0 0 12px;font-size:15px;line-height:1.8;">בעבר, כשהתייעצת איתי, המלצתי על השקעה במניות ישראליות. <strong>היום ההמלצה השתנתה</strong> — אני ממליץ שלא להשקיע בקרנות ובמסלולים שמשקיעים במניות ישראליות:</p>' +
  '<ol style="margin:0;padding-inline-start:20px;font-size:15px;line-height:1.8;">' +
  '<li>מכפיל הרווח שלהן גבוה מדי — פגיעה בפוטנציאל התשואה העתידי וכן גורם סיכון.</li>' +
  '<li>מצב הנדל"ן בארץ בעייתי מאוד, ומשבר בענף הזה יקרין גם על ענפים אחרים.</li>' +
  '<li>התחזקות הדולר תפגע בחברות יצואניות.</li>' +
  '</ol></div></div></div>';

// ====== לשונית "פנסיה והשתלמות" — הזמנה לתכנון פנסיוני (למי שאין #11) ======
var PENSION_INVITE_HTML =
  '<div class="content-hero"><div class="container">' +
  '<div class="eyebrow">אזור לקוחות · פנסיה והשתלמות</div>' +
  '<h1>פנסיה והשתלמות</h1>' +
  '</div></div>' +
  '<div style="background:var(--bg-cream,#F8F6F3);padding:48px 0 64px;"><div class="container">' +
  '<div class="portfolio-card" style="padding:30px 34px;max-width:680px;margin:0 auto;text-align:center;">' +
  '<div style="font-size:20px;font-weight:800;color:var(--primary,#1F4E79);margin-bottom:14px;">רוצה לוודא שהחיסכון הפנסיוני שלך בנוי נכון?</div>' +
  '<p style="margin:0 0 24px;font-size:16px;line-height:1.9;color:var(--text-secondary,#4A4A6A);">בתכנון פנסיוני אישי נעבור יחד על קרן הפנסיה, קרן ההשתלמות וקופות הגמל שלך — נבדוק מסלולים, דמי ניהול ופיזור סיכונים, ונבנה תוכנית שמתאימה בדיוק לך ולמטרות שלך.</p>' +
  '<a href="https://wa.me/972527700599" style="display:inline-block;background:var(--primary,#1F4E79);color:#fff;padding:14px 34px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">💬 לתיאום תכנון פנסיוני</a>' +
  '</div></div></div>';

// ====== לשונית IRA — טבלת השוואה + המלצת מעבר לניהול עצמאי (למי שאין #8) ======
var IRA_COMPARISON_STYLE =
  '<style>' +
  '.comparison-table{width:100%;border-collapse:collapse;margin:8px 0 18px;font-size:15px;}' +
  '.comparison-table th{background:var(--primary,#1F4E79);color:#fff;padding:12px 16px;text-align:right;font-weight:600;}' +
  '.comparison-table td{padding:12px 16px;border-bottom:1px solid var(--border,#E4E1DC);vertical-align:top;}' +
  '.comparison-table tr:nth-child(even) td{background:var(--bg-cream,#F8F6F3);}' +
  '.comparison-table .highlight{font-weight:700;color:var(--primary,#1F4E79);}' +
  '.comparison-table .check{color:var(--positive,#1a7f44);font-weight:700;}' +
  '.comparison-table .cross{color:var(--accent,#D74E3C);font-weight:700;}' +
  '</style>';

var IRA_COMPARISON_TABLE =
  '<div style="overflow-x:auto;"><table class="comparison-table"><thead><tr>' +
  '<th></th>' +
  '<th>מסלול מחקה S&amp;P 500</th>' +
  '<th>מסלול מחקה מדד ACWI<br><span style="font-weight:400;font-size:12px;">(כולל שווקים מתעוררים)</span></th>' +
  '<th>תיק IRA אופציונלי<br><span style="font-weight:400;font-size:12px;">(בניהול אישי)</span></th>' +
  '</tr></thead><tbody>' +
  '<tr><td class="highlight">חברות</td><td>כ-500</td><td>כ-2,500</td><td>כ-2,300</td></tr>' +
  '<tr><td class="highlight">מדינות</td><td><span class="cross">1</span></td><td><span class="check">47</span></td><td><span class="check">כ-47</span></td></tr>' +
  '<tr><td class="highlight">מטבעות</td><td><span class="cross">דולר בלבד</span></td><td><span class="check">סל מטבעות גלובלי</span></td><td><span class="check">כ-50% דולר, היתר מגודר לשקל</span></td></tr>' +
  '<tr><td class="highlight">משקל 9 החברות הגדולות</td><td><span class="cross">כ-39%</span></td><td>כ-25%</td><td><span class="check">כ-8%</span></td></tr>' +
  '<tr><td class="highlight">מכפיל רווח (P/E)</td><td><span class="cross">כ-27</span></td><td>כ-23</td><td><span class="check">כ-20</span></td></tr>' +
  '<tr><td class="highlight">אם ארה"ב מדשדשת עשור</td><td><span class="cross">כל החיסכון מדשדש איתה</span></td><td><span class="check">המשקל מתעדכן אוטומטית לטובת מי שמוביל</span></td><td><span class="check">מתעדכן אוטומטית, ופחות תלות בקומץ ענקיות</span></td></tr>' +
  '</tbody></table></div>' +
  '<p style="font-size:12px;color:#999;margin:0 0 6px;">נתונים נכונים ליולי 2026. מקורות: Slickcharts, stockanalysis.com. מכפיל רווח (P/E): S&amp;P 500 לפי VOO (~27), ACWI (~23).</p>';

function buildIraPromo(hasTag11) {
  var discount = hasTag11
    ? '<div style="margin-top:18px;padding:14px 18px;background:#eafaf0;border-right:4px solid var(--positive,#1a7f44);border-radius:8px;font-size:15px;font-weight:700;color:#0f5c30;">🎁 50% הנחה ללקוחות תכנון פיננסי על צירוף ל-IRA.</div>'
    : '';
  return '<div class="content-hero"><div class="container">' +
    '<div class="eyebrow">אזור לקוחות · IRA</div>' +
    '<h1>ניהול עצמאי (IRA)</h1>' +
    '</div></div>' +
    '<div style="background:var(--bg-cream,#F8F6F3);padding:40px 0 60px;"><div class="container">' +
    IRA_COMPARISON_STYLE + IRA_COMPARISON_TABLE +
    '<div class="portfolio-card" style="padding:26px 30px;max-width:760px;margin:22px auto 0;line-height:1.9;font-size:15px;">' +
    '<p style="margin:0 0 12px;">אם יש לך צבירה של <strong>75,000 ש"ח ומעלה</strong> בקרן השתלמות (לא של עובדי הוראה) או בקופת גמל פנסיונית (לא גמל להשקעה) — אני ממליץ שתשקול להעביר אותה לקופה בניהול עצמאי.</p>' +
    '<p style="margin:0 0 12px;">בדרך זו תוכל לפזר את הסיכונים בצורה <strong>הרבה יותר טובה</strong> ממה שניתן לפזר באמצעות המסלולים הסטנדרטיים, ולהערכתי להשיג גם תשואה גבוהה יותר בטווח הארוך.</p>' +
    '<p style="margin:0 0 12px;">מעבר לכך, דמי הניהול שלך יהיו נמוכים יותר.</p>' +
    '<p style="margin:0;">קרא עוד על IRA בדף <a href="/investment/ira/" style="color:var(--primary,#1F4E79);font-weight:600;">pensya.info/investment/ira</a>.</p>' +
    discount +
    '</div></div></div>';
}

function buildSections(data) {
  var origTags = (data.tags && data.tags.length > 0) ? data.tags : KNOWN_TAGS;
  var has = function(id) { return origTags.some(function(t) { return t.id === id; }); };
  var hasTag2  = has(2);
  var hasTag8  = has(8);
  var hasTag10 = has(10);
  var hasTag11 = has(11);

  if (data.sections && data.sections.length > 0) {
    return Promise.resolve(data.sections.concat([buildInsuranceSection(hasTag11), DONATIONS_SECTION]));
  }

  // שולפים תוכן רק לתגיות שיש ללקוח דף תוכן אישי עבורן
  return Promise.all([
    hasTag11 ? fetchTagHtml(11) : Promise.resolve(null),
    hasTag8  ? fetchTagHtml(8)  : Promise.resolve(null),
    hasTag10 ? fetchTagHtml(10) : Promise.resolve(null)
  ]).then(function(r) {
    var html11 = r[0], html8 = r[1], html10 = r[2];
    var sections = [];

    // 1. פנסיה והשתלמות — לכולם
    sections.push({
      tagName: 'פנסיה והשתלמות',
      html: (hasTag11 && html11) ? (ISRAELI_NOTICE_BANNER + html11) : PENSION_INVITE_HTML
    });

    // 2. IRA — לכולם
    sections.push({
      tagName: 'IRA',
      html: (hasTag8 && html8) ? (ISRAELI_NOTICE_BANNER + html8) : buildIraPromo(hasTag11)
    });

    // 3. ביטוחים — לכולם
    sections.push(buildInsuranceSection(hasTag11));

    // 4. תיק השקעות — לכולם
    var portfolioHtml;
    if (hasTag10 && html10) {
      portfolioHtml = ISRAELI_NOTICE_BANNER + html10;         // בעל תיק ני"ע — התיק שלו + הודעת מניות ישראליות
    } else if (hasTag2) {
      portfolioHtml = ISRAELI_NOTICE_TAB;                     // התייעץ בלבד (#2) — הודעה בלבד
    } else {
      portfolioHtml = PROMO_HTML;                             // ברירת מחדל — הזמנה לפתוח תיק
    }
    sections.push({ tagName: 'תיק השקעות', html: portfolioHtml });

    // 5. זיכוי על תרומות — לכולם
    sections.push(DONATIONS_SECTION);

    return sections;
  });
}

(function checkSession() {
  var saved = sessionStorage.getItem('pensya_client_auth');
  if (!saved) return;
  try {
    var parsed = JSON.parse(saved);
    if (parsed.sections && parsed.sections.length > 0) {
      buildUI(parsed.sections, parsed.name);
    } else {
      sessionStorage.removeItem('pensya_client_auth');
    }
  } catch(e) {
    sessionStorage.removeItem('pensya_client_auth');
  }
})();

document.getElementById('auth-form').addEventListener('submit', function(e) {
  e.preventDefault();
  clearError();

  var email = document.getElementById('email-input').value.trim().toLowerCase();
  var phone = normalizePhone(document.getElementById('phone-input').value);

  if (!email || !phone) { showError('נא למלא מייל וטלפון.'); return; }

  setLoading(true);

  var url = APPS_SCRIPT_URL +
    '?email=' + encodeURIComponent(email) +
    '&phone=' + encodeURIComponent(phone) +
    '&token=' + encodeURIComponent(AUTH_TOKEN);

  fetch(url, { redirect: 'follow' })
    .then(function(res) {
      if (!res.ok) throw new Error('network_error');
      return res.json();
    })
    .then(function(data) {
      if (!data.success) {
        showError('הפרטים לא זוהו. ודא שהמייל והטלפון זהים לאלו שמסרת בפתיחת החשבו�