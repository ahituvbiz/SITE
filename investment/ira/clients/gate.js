// gate.js — v2 | tag-based content injection
// ============================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxCUh36Y_mpHbElHdRROhOt0Ke2JxFwcTLEefp9YBYlWtU-l23OQa5jEvVbiaZiq_P1/exec';
const AUTH_TOKEN      = 'pensya-ira-2024';

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

// ============================================================
//  בניית ממשק התוכן אחרי אימות מוצלח
// ============================================================
function buildUI(sections, name) {
  gateSection.style.display    = 'none';
  contentSection.style.display = 'block';
  contentFooter.style.display  = 'block';

  const headerBar = document.getElementById('content-header-bar');
  const panelsDiv = document.getElementById('tab-panels');

  // ── אין תוכן ──────────────────────────────────────────────
  if (!sections || sections.length === 0) {
    headerBar.innerHTML = buildWelcomeBar(name);
    panelsDiv.innerHTML = '<div style="padding:60px 20px;text-align:center;color:#666;">אין תוכן זמין עבור חשבונך כרגע. לשאלות — פנה לאיתן ישירות.</div>';
    wireLogout();
    return;
  }

  // ── סקשן יחיד — ללא טאבים ──────────────────────────────
  if (sections.length === 1) {
    headerBar.innerHTML = buildWelcomeBar(name);
    panelsDiv.innerHTML = `<div class="tab-panel tab-panel-active">${sections[0].html}</div>`;
    wireLogout();
    return;
  }

  // ── מספר סקשנים — עם טאבים ─────────────────────────────
  const tabBtns = sections.map((s, i) =>
    `<button class="tab-btn${i === 0 ? ' tab-active' : ''}" data-idx="${i}">${s.tagName}</button>`
  ).join('');

  headerBar.innerHTML = `
    ${buildWelcomeBar(name)}
    <nav class="tab-bar">
      <div class="container tab-bar-inner">${tabBtns}</div>
    </nav>`;

  panelsDiv.innerHTML = sections.map((s, i) =>
    `<div class="tab-panel${i === 0 ? ' tab-