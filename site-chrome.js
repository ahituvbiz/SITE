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
