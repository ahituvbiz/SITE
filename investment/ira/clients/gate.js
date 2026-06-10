// gate.js — v2 | tag-based content injection

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
    sessionStorage.removeItem('pensya_ira_auth');
    location.reload();
  });
}

(function checkSession() {
  var saved = sessionStorage.getItem('pensya_ira_auth');
  if (!saved) return;
  try {
    var parsed = JSON.parse(saved);
    buildUI(parsed.sections, parsed.name);
  } catch(e) {
    sessionStorage.removeItem('pensya_ira_auth');
  }
})();

document.getElementById('auth-form').addEventListener('submit', function(e) {
  e.preventDefault();
  clearError();

  var email = document.getElementById('email-input').value.trim().toLowerCase();
  var phone = normalizePhone(document.getElementById('phone-input').value);

  if (!email || !phone) { showError('נא למלא מייל וטלפון.'); return; }

  setLoading(true);

  var url = APPS_SCRIPT_URL + '?email=' + encodeURIComponent(email) + '&phone=' + encodeURIComponent(phone) + '&token=' + encodeURIComponent(AUTH_TOKEN);

  fetch(url, { redirect: 'follow' })
    .then(function(res) {
      if (!res.ok) throw new Error('network_error');
      return res.json();
    })
    .then(function(data) {
      if (data.success) {
        sessionStorage.setItem('pensya_ira_auth', JSON.stringify({ name: data.name, sections: data.sections }));
        buildUI(data.sections, data.name);
      } else {
        showError('הפרטים לא זוהו. ודא שהמייל והטלפון זהים לאלו שמסרת בפתיחת החשבון.');
      }
    })
    .catch(function() {
      showError('שגיאת תקשורת — נסה שוב עוד רגע.');
    })
    .finally(function() {
      setLoading(false);
    });
});
