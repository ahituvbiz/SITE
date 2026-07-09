// gate.js — v6 | tag-based personalized content + insurance tab

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDTXhB6W_xNLW644t7hdzjGmMtU_7rsLoVNTxD9B_9No5OJ-QW3hXdzkutSxuYSI46/exec';
const AUTH_TOKEN      = 'pensya-ira-2024';
const CONTENT_BASE    = '/clients/content/tag-';

const KNOWN_TAGS = [
  { id: 8,  name: 'IRA' },
  { id: 10, name: 'תיק השקעות' }
];

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
    return '<button class="tab-btn' + (i === 0 ? ' tab-active' : '') + '" data-idx="' + i + '">' + s.tagName + '</button>';
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
  'אם אתה שכיר שמשלם מס הכנסה ותורם לעמותות בעלות אישור לפי <strong>סעיף 46</strong>, ' +
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
  '<div style="background:var(--bg-cream);padding:48px 0 64px;">' +
  '<div class="container">' +
  '<div class="intro-note" style="max-width:640px;margin:0 auto;font-size:17px;line-height:1.9;">' +
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

function buildSections(data) {
  var origTags = (data.tags && data.tags.length > 0) ? data.tags : KNOWN_TAGS;
  var hasTag = function(id) { return origTags.some(function(t) { return t.id === id; }); };
  var hasTag2  = hasTag(2);
  var hasTag8  = hasTag(8);
  var hasTag10 = hasTag(10);
  var hasTag11 = hasTag(11);

  var INSURANCE_SECTION = buildInsuranceSection(hasTag11);

  if (data.sections && data.sections.length > 0) {
    return Promise.resolve(data.sections.concat([INSURANCE_SECTION, DONATIONS_SECTION]));
  }

  var tagList = origTags.slice();

  // מי שיש לו תגית 10 רואה גם את תוכן תגית 8 (לשונית IRA כהתייחסות)
  if (hasTag10 && !hasTag8) {
    tagList = tagList.concat([{ id: 8, name: 'IRA' }]);
  }
  var hasPortfolio = hasTag8 || hasTag10;

  return Promise.all(tagList.map(function(tag) {
    return fetchTagHtml(tag.id).then(function(html) {
      return html ? { html: html, tagName: tag.name, tagId: tag.id } : null;
    });
  })).then(function(results) {
    var sections = results.filter(function(s) { return s !== null; });

    // הזרקת באנר "עדכון המלצה — מניות ישראליות" לראש הלשונית הרלוונטית
    sections.forEach(function(s) {
      if (s.tagId === 10) {
        s.html = ISRAELI_NOTICE_BANNER + s.html;
      } else if (s.tagId === 8 && !hasTag10) {
        s.html = ISRAELI_NOTICE_BANNER + s.html;
      } else if (s.tagId === 11) {
        s.html = ISRAELI_NOTICE_BANNER + s.html;
      }
    });

    // מי שהתייעץ על ני"ע בלבד (#2) וללא תיק/IRA — לשונית "תיק השקעות" עם ההודעה בלבד
    var addTwoTab = hasTag2 && !hasTag10 && !hasTag8;
    if (addTwoTab) {
      sections.unshift({ tagName: 'תיק השקעות', html: ISRAELI_NOTICE_TAB, tagId: 2 });
    }

    if (!hasPortfolio && !addTwoTab) {
      sections.push(PROMO_SECTION);
    }
    sections.push(INSURANCE_SECTION);
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
        showError('הפרטים לא זוהו. ודא שהמייל והטלפון זהים לאלו שמסרת בפתיחת החשבון.');
        return;
      }
      return buildSections(data).then(function(sections) {
        sessionStorage.setItem('pensya_client_auth', JSON.stringify({ name: data.name, sections: sections }));
        buildUI(sections, data.name);
      });
    })
    .catch(function() {
      showError('שגיאת תקשורת — נסה שוב עוד רגע.');
    })
    .finally(function() {
      setLoading(false);
    });
});
