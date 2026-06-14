// gate.js — v3 | hybrid content: Drive (sections) / Server (tags) / Server fallback

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzDTXhB6W_xNLW644t7hdzjGmMtU_7rsLoVNTxD9B_9No5OJ-QW3hXdzkutSxuYSI46/exec';
const AUTH_TOKEN      = 'pensya-ira-2024';
const CONTENT_BASE    = '/clients/content/tag-';  // Cloudflare מגיש ללא סיומת .html

// כל התגיות הידועות (לפי מזהה) — fallback כשה-API לא מחזיר תוכן
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

// טוען HTML של תגית מהשרת; מחזיר null אם לא קיים
function fetchTagHtml(tagId) {
  return fetch(CONTENT_BASE + tagId)
    .then(function(res) { return res.ok ? res.text() : null; })
    .catch(function() { return null; });
}

// טאב שיווקי — מוצג לכל מי שאין לו תגית תיק השקעות (10) או IRA (8)
var PROMO_SECTION = {
  tagName: 'פתיחת תיק השקעות',
  html: '<div class="content-hero"><div class="container">' +
    '<div class="eyebrow">אזור לקוחות · הזדמנות</div>' +
    '<h1>רצית לפתוח תיק השקעות?</h1>' +
    '</div></div>' +
    '<div style="background:var(--bg-cream);padding:48px 0 64px;">' +
    '<div class="container"><div class="intro-note" style="max-width:620px;margin:0 auto;text-align:center;">' +
    '<p style="font-size:17px;line-height:1.8;margin-bottom:24px;">' +
    'רצית לפתוח תיק השקעות וחששת לעשות את זה לבד?<br>' +
    '<strong>פנה אלינו — ונסייע לך לעשות את זה נכון.</strong>' +
    '</p>' +
    '<p style="font-size:14px;color:var(--text-meta);margin-bottom:32px;">השירות כרוך בתשלום</p>' +
    '<a href="https://wa.me/972527700599" style="display:inline-block;background:var(--primary);color:#fff;' +
    'padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;">' +
    '💬 דברו איתנו בוואטסאפ' +
    '</a>' +
    '</div></div></div>'
};

// בונה sections לפי עדיפות:
//   1. sections עם HTML מוטמע מה-API (Drive — מוגן, מועדף)
//   2. tags עם fetch מהשרת (API מחזיר מזהים בלבד)
//   3. fallback — טוען את כל התגיות הידועות מהשרת
function buildSections(data) {
  // עדיפות 1: sections עם HTML מלא
  if (data.sections && data.sections.length > 0) {
    return Promise.resolve(data.sections);
  }

  // עדיפות 2: API מחזיר מזהי תגיות (פורמט חדש)
  var tagList = data.tags && data.tags.length > 0 ? data.tags : null;

  // עדיפות 3: fallback — כל התגיות הידועות
  if (!tagList) tagList = KNOWN_TAGS;

  // בדוק אם הלקוח כבר מנהל תיק (תגית 8 = IRA, תגית 10 = תיק השקעות)
  var hasPortfolio = tagList.some(function(t) { return t.id === 8 || t.id === 10; });

  return Promise.all(tagList.map(function(tag) {
    return fetchTagHtml(tag.id).then(function(html) {
      return html ? { html: html, tagName: tag.name } : nul