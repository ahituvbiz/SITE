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
const welcomeName    = document.getElementById('welcome-name');

function showError(msg) {
  errorDiv.textContent = msg;
  errorDiv.style.display = 'block';
}
function clearError() {
  errorDiv.style.display = 'none';
}
function setLoading(on) {
  submitBtn.disabled = on;
  btnText.innerHTML = on ? '<span class="spinner"></span>' : 'כניסה';
}
function showContent(name) {
  gateSection.style.display = 'none';
  contentSection.style.display = 'block';
  contentFooter.style.display = 'block';
  welcomeName.textContent = name || '';
}

(function checkSession() {
  const saved = sessionStorage.getItem('pensya_ira_auth');
  if (saved) {
    try {
      const { name } = JSON.parse(saved);
      showContent(name);
    } catch(e) {
      sessionStorage.removeItem('pensya_ira_auth');
    }
  }
})();

document.getElementById('logout-btn').addEventListener('click', function() {
  sessionStorage.removeItem('pensya_ira_auth');
  contentSection.style.display = 'none';
  contentFooter.style.display = 'none';
  gateSection.style.display = 'flex';
  clearError();
});

document.getElementById('auth-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  clearError();

  const email = document.getElementById('email-input').value.trim().toLowerCase();
  const phone = normalizePhone(document.getElementById('phone-input').value);

  if (!email || !phone) {
    showError('נא למלא מייל וטלפון.');
    return;
  }

  setLoading(true);

  try {
    const url = `${APPS_SCRIPT_URL}?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&token=${encodeURIComponent(AUTH_TOKEN)}`;
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('network_error');
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem('pensya_ira_auth', JSON.stringify({ name: data.name }));
      showContent(data.name);
    } else {
      showError('הפרטים לא זוהו. ודא שהמייל והטלפון זהים לאלו שמסרת בפתיחת החשבון.');
    }
  } catch (err) {
    showError('שגיאת תקשורת — נסה שוב עוד רגע. אם הבעיה חוזרת, פנה לאיתן ישירות.');
  } finally {
    setLoading(false);
  }
});
