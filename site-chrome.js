/* site-chrome.js - התנהגות ה-header המשותף: התפריט הנייד (המבורגר).
   מקור האמת: אתר/site-chrome/site-chrome.js. נפרס לשורש האתר ומקושר לכל דף על ידי build.py.
   לא להעתיק קוד תפריט לדפים עצמם. הקוד כאן עובד גם לצד קוד ישן שנשאר בדפים:
   הוא לא "מחליף מצב" אלא קובע את המצב הרצוי אחרי שכל שאר המאזינים רצו. */
(function(){
  function init(){
    var header=document.querySelector('header.header'); if(!header) return;
    var btn=header.querySelector('#hamburger, .hamburger'), nav=header.querySelector('.nav');
    if(!btn||!nav) return;
    var overlay=header.querySelector('.nav-overlay');
    function set(open){
      if(open) header.style.setProperty('--chrome-nav-top', Math.max(0,Math.round(header.getBoundingClientRect().bottom))+'px');
      btn.classList.toggle('open',open); nav.classList.toggle('open',open);
      if(overlay) overlay.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',String(open));
      /* דף שאין לו עיצוב משלו לתפריט הפתוח מקבל את העיצוב המשותף מ-site-chrome.css (מחלקת chrome-nav).
         דף שיש לו עיצוב משלו נשאר כמו שהוא. */
      if(open && window.getComputedStyle(nav).display==='none'){
        nav.classList.add('chrome-nav'); if(overlay) overlay.classList.add('chrome-nav');
      }
      if(open && nav.classList.contains('chrome-nav')){ /* תיקון עצמי: הצמדה לתחתית ה-header */
        var diff=nav.getBoundingClientRect().top-header.getBoundingClientRect().bottom;
        if(Math.abs(diff)>1){
          var cur=parseFloat(header.style.getPropertyValue('--chrome-nav-top'))||0;
          header.style.setProperty('--chrome-nav-top', Math.max(0,Math.round(cur-diff))+'px');
        }
      }
    }
    function later(open){ setTimeout(function(){ set(open); },0); }
    document.addEventListener('click',function(e){
      var t=e.target; if(!t||!t.closest) return;
      if(t.closest('#hamburger, header.header .hamburger')){ later(!nav.classList.contains('open')); return; }
      if(!nav.classList.contains('open')) return;
      if(t.closest('header.header .nav a') || t.closest('header.header .nav-overlay') || !t.closest('header.header')) later(false);
    },true);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape' && nav.classList.contains('open')) set(false); });
    window.addEventListener('resize',function(){
      if(nav.classList.contains('open') && window.getComputedStyle(btn).display==='none') set(false);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

/* פסי הודעה מתחת ל-header המשותף, בכל דף שיש בו header (12.11.26):
   1. סוף שנת המס: 1.11 עד 31.12 בכל שנה. לא בדף הכלי עצמו. בדף שבו הפס כבר כתוב ב-HTML (דף הבית, דף המחשבונים) לא מוסיפים שוב.
   2. וובינר לעצמאים: עד שעת סיום ההרצאה (WEBINAR.end), ואז נעלם לבד. למועד הבא מעדכנים כאן את WEBINAR. */
(function(){
  var WEBINAR = {
    end:  '2026-11-22T21:45:00+02:00',
    href: '/services/pension-webinar/self-employed/',
    text: '🎙️ <b>וובינר חינם לעצמאים</b> · יום ראשון 22.11 בשעה 21:00. מיסוי, נזילות, כיסוי סיכונים ודאגה לעתיד.',
    go:   'לפרטים ולהרשמה ←'
  };
  function strip(cls, href, html, go){
    var d = document.createElement('div'); d.className = 'cstrip ' + cls;
    var a = document.createElement('a'); a.href = href;
    var s1 = document.createElement('span'); s1.innerHTML = html;
    var s2 = document.createElement('span'); s2.className = 'cstrip-go'; s2.textContent = go;
    a.appendChild(s1); a.appendChild(s2); d.appendChild(a); return d;
  }
  /* העיצוב מוזרק מכאן ולא מ-site-chrome.css, כדי שהפסים ייראו נכון גם בדפים שלא מקשרים לקובץ ה-CSS המשותף */
  var CSS = '.cstrip{background:#1A1A1A;color:#fff;direction:rtl;font-family:Heebo,system-ui,sans-serif}.cstrip a{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;padding:11px 20px;color:#fff!important;text-decoration:none!important;font-size:15px;line-height:1.4;text-align:center}.cstrip a:hover{background:rgba(255,255,255,.1)}.cstrip b{font-weight:700;color:#fff}.cstrip .cstrip-go{background:#D74E3C;color:#fff;border-radius:999px;padding:4px 14px;font-weight:600;font-size:14px;white-space:nowrap}.cstrip.cstrip-web{background:#007DA8}.cstrip.cstrip-web .cstrip-go{background:#fff;color:#006487}';
  function init(){
    var header = document.querySelector('header.header'); if(!header) return;
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var now = new Date(), y = now.getFullYear(), path = location.pathname, after = header;
    var ye = document.getElementById('ye-strip');
    if(ye){ after = ye; }
    else if(path.indexOf('/tools/sof-shana') !== 0 && now >= new Date(y,10,1)){
      var d = Math.ceil((new Date(y,11,31,23,59,59) - now) / 86400000);
      if(d >= 1){
        var el = strip('cstrip-ye', '/tools/sof-shana/', '⏳ <b>' + (d===1 ? 'נשאר יום אחד' : 'נשארו ' + d + ' ימים') + '</b> לסוף שנת המס. מה שלא תסגור עד 31.12, הולך.', 'למשימות שלך לפני סוף השנה ←');
        after.insertAdjacentElement('afterend', el); after = el;
      }
    }
    if(now < new Date(WEBINAR.end) && path.indexOf(WEBINAR.href) !== 0){
      after.insertAdjacentElement('afterend', strip('cstrip-web', WEBINAR.href, WEBINAR.text, WEBINAR.go));
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
