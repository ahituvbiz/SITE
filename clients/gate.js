// gate.js — v4 | tag-based personalized content

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
    panelsDiv.innerHTML = '<div class="tab-panel tab-panel-active">' + sections[0].html + '</div>';
    wireLogout();
    return;
  }

  var tabBtns = sections.map(function(s, i) {
    return '<button class="tab-btn' + (i === 0 ? ' tab-active' : '') + '" data-idx="' + i + '">' + s.tagName + '</button>';
  }).join('');

  headerBar.innerHTML = buildWelcomeBar(name) +
    '<nav class="tab-bar"><div class="container tab-bar-inner">' + tabBtns + '</div></nav>';

  panelsDiv.innerHTML = sections.map(function(s, i) {
    return '<div class="tab-panel' + (i === 0 ? ' tab-panel-active' : '') + '" data-idx="' + i + '">' + s.html + '</div>';
  }).join('');

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
  'רצית לפתוח תיק השקעות וחששת לעשות את זה לבד?<br>' +
  '<strong>פנה אלינו — ונסייע לך לעשות את זה נכון.</strong>' +
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
  '<div class="intro-note" style="max-width:680px;margin:0 auto;">' +
  'אם אתה שכיר שמשלם מס הכנסה ותורם לעמותות בעלות אישור לפי <strong>סעיף 46</strong>, ' +
  'מגיע לך זיכוי במס על התרומה. במקום להגיש בקשה להחזר מס בסוף השנה, אפשר להגדיר באזור האישי ' +
  'באתר רשות המיסים מיהו המעסיק שלך — וכך הזיכוי על התרומה ייכנס <strong>אוטומטית לתלוש השכר</strong> שלך.' +
  '</div>' +
  '<div class="intro-note" style="max-width:680px;margin:20px auto 0;">' +
  'הקובץ המצורף מסביר שלב אחר שלב איך לעשות את זה.' +
  '</div>' +
  '<div style="text-align:center;margin:32px auto 0;">' +
  '<a href="/clients/files/zikui-trumot.pdf" target="_blank" rel="noopener" ' +
  'style="display:inline-block;background:var(--primary);color:#fff;padding:14px 32px;' +
  'border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">' +
  '📄 פתיחת המדריך (PDF)' +
  '</a>' +
  '</div>' +
  '<div style="max-width:680px;margin:32px auto 0;">' +
  '<object data="/clients/files/zikui-trumot.pdf" type="application/pdf" ' +
  'style="width:100%;height:560px;border:1px solid #e0dccf;border-radius:8px;">' +
  '<p style="text-align:center;padding:20px;color:var(--text-meta);">' +
  'לא ניתן להציג את הקובץ כאן — ' +
  '<a href="/clients/files/zikui-trumot.pdf" target="_blank" rel="noopener" style="color:var(--primary);font-weight:600;">לחץ לפתיחת המדריך</a>.' +
  '</p></object>' +
  '</div>' +
  '<div class="intro-note" style="max-width:680px;margin:28px auto 0;">' +
  'למידע נוסף באתר רשות המיסים: ' +
  '<a href="https://www.gov.il/he/pages/tax-credit-for-donations-to-individuals" target="_blank" rel="noopener" ' +
  'style="color:var(--primary);font-weight:600;">זיכוי ממס בגין תרומות</a>.' +
  '</div>' +
  '</div></div>';

var DONATIONS_SECTION = { tagName: 'זיכוי על תרומות', html: DONATIONS_HTML };

function buildSections(data) {
  if (data.sections && data.sections.length > 0) {
    return Promise.resolve(data.sections.concat([DONATIONS_SECTION]));
  }

  var tagList = data.tags && data.tags.length > 0 ? data.tags : null;
  if (!tagList) tagList = KNOWN_TAGS;

  // מי שיש לו תגית 10 רואה גם את תוכן תגית 8
  var hasTag10 = tagList.some(function(t) { return t.id === 10; });
  var hasTag8  = tagList.some(function(t) { return t.id === 8; });
  if (hasTag10 && !hasTag8) {
    tagList = tagList.concat([{ id: 8, name: 'IRA' }]);
  }
  var hasPortfolio = hasTag8 || hasTag10;

  return Promise.all(tagList.map(function(tag) {
    return fetchTagHtml(tag.id).then(function(html) {
      return html ? { html: html, tagName: tag.name } : null;
    });
  })).then(function(results) {
    var sections = results.filter(function(s) { return s !== null; });
    if (!hasPortfolio) {
      sections.push(PROMO_SECTION);
    }
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
