/**
 * pensya.info — Site-wide search
 * Searches across all published pages via a static index.
 * Include this file once per page; it auto-attaches to #site-search / #search-results.
 */

const SITE_SEARCH_INDEX = [
  {
    title: 'דף הבית — תכנון פיננסי בלי קונפליקט אינטרסים',
    url: '/',
    desc: 'יועץ פנסיוני בעל רישיון משרד האוצר. אובייקטיבי לפי חוק. פנסיה, חיסכון, ביטוחים ומשכנתא.',
    kw: 'תכנון פיננסי יועץ פנסיוני רישיון אובייקטיבי עמלות פנסיה'
  },
  {
    title: 'IRA — קופת גמל והשתלמות בניהול אישי',
    url: '/ira/',
    desc: 'שאלון התאמה אינטראקטיבי, המלצת ברוקר וחישוב עלויות שנתיות. שירות צירוף 890 ₪.',
    kw: 'IRA ניהול אישי קופת גמל קרן השתלמות ברוקר גלובלנט פסגות IBI לאומי מזרחי'
  },
  {
    title: 'IRA: למה להעדיף השתלמות, ולמה לא לגעת בפנסיה',
    url: '/ira/explained/',
    desc: 'מאמר חינוכי מעמיק — מתי IRA כן, מתי לא, ו-5 סיבות לא לגעת בפנסיה.',
    kw: 'IRA מאמר מדריך קרן השתלמות גמל פנסיה אסור אכע שאירים אגח מיועדות'
  },
  {
    title: 'עמלות IRA — השוואת 5 ברוקרים',
    url: '/ira/fees/',
    desc: 'טבלת עמלות מלאה: פסגות, IBI, מזרחי, הבינלאומי, לאומי. ישראל, ארה"ב, אירופה ואג"ח.',
    kw: 'עמלות IRA ברוקר פסגות IBI מזרחי הבינלאומי לאומי גלובלנט דמי ניהול'
  },
  {
    title: 'כללי השקעה רגולטוריים ב-IRA',
    url: '/ira/rules/',
    desc: 'מה מותר ומה אסור ב-IRA לפי תקנות 2009 + טיוטת תקנות 2025 מהאוצר.',
    kw: 'IRA כללי השקעה רגולציה תקנות 2025 מגבלות ריכוז כסף פנסיוני'
  },
  {
    title: 'יתרון דחיית המס ב-IRA',
    url: '/investment/ira-tax-deferral/',
    desc: 'איך ריבית דריבית על "כסף המס" יוצרת הפרש של 500,000 ₪ לאורך 30 שנה.',
    kw: 'דחיית מס IRA ריבית דריבית רווחי הון מס מיסוי השקעות'
  },
  {
    title: 'חיסכון לכל ילד — המדריך השלם',
    url: '/savings/hisachon-layeled/',
    desc: 'סכומים, מענקים, הכפלה, בנק מול קופת גמל — ומה שווה פי 100 ממנו.',
    kw: 'חיסכון לכל ילד ביטוח לאומי הכפלה קופת גמל בנק מענק גיל 18 21'
  },
  {
    title: 'קרן כספית — המדריך השלם',
    url: '/savings/keren-kaspit/',
    desc: 'מה זה, יתרון מס ריאלי, 4 סוגי קרנות, איך קונים לבד בבנק.',
    kw: 'קרן כספית פיקדון ריבית מס ריאלי שקלית מטח קונצרני מחלקת'
  },
  {
    title: 'אודות איתן אחיטוב — יועץ פנסיוני',
    url: '/about/',
    desc: 'הסיפור שלי: מהבנק לעצמאות, רישיון מס\' X-XXXX, 6 בחינות רשות ני"ע.',
    kw: 'איתן אחיטוב אודות יועץ פנסיוני רישיון ביוגרפיה'
  },
  {
    title: 'רישיון יועץ פנסיוני — למה זה חשוב',
    url: '/about/license/',
    desc: 'ההבדל בין יועץ, מתכנן וסוכן. 12 מיליארד ₪ עמלות בשנה — ולמה זה לא הולך אליי.',
    kw: 'רישיון יועץ פנסיוני משרד האוצר עמלות אובייקטיבי פיקוח רשות שוק ההון'
  },
  {
    title: 'יועץ פנסיוני vs מתכנן פיננסי vs סוכן ביטוח',
    url: '/about/advisor-vs-agent/',
    desc: 'טבלת השוואה ראש-ראש-ראש ב-8 קריטריונים. מי מחויב למי, ומי מרוויח מה.',
    kw: 'יועץ פנסיוני מתכנן פיננסי סוכן ביטוח השוואה רישיון עמלות'
  },
  {
    title: 'כמה עולה ייעוץ פנסיוני',
    url: '/about/pricing/',
    desc: 'מחירון שקוף: שיחת אבחון חינם, תכנית מקיפה, IRA. כולל מחשבון ROI.',
    kw: 'מחיר ייעוץ פנסיוני עלות תשלום ROI כמה עולה שכר טרחה'
  },
  {
    title: 'איך לבחור יועץ פנסיוני מומלץ',
    url: '/about/recommended-advisor/',
    desc: '8 שאלות לשאול לפני, איך לבדוק רישיון ברשות שוק ההון.',
    kw: 'יועץ פנסיוני מומלץ איך לבחור בדיקה רישיון שאלות'
  },
  {
    title: 'מחשבונים פיננסיים — מרכז הכלים',
    url: '/tools/',
    desc: 'מחשבון פנסיה לעצמאים, חיסכון במס, נדל"ן מול שוק ההון, דמי ניהול ו-ROI ייעוץ.',
    kw: 'מחשבון פיננסי כלים פנסיה עצמאי מס נדלן שוק ההון דמי ניהול ROI'
  },
  {
    title: 'מחשבון פנסיה לעצמאים',
    url: '/tools/pension-calc-self-employed/',
    desc: 'חישוב הפקדה מומלצת, חיסכון במס ותחזית צבירה לפרישה — לעצמאי ופרילנסר.',
    kw: 'מחשבון פנסיה עצמאי פרילנסר הפקדה מס צבירה פרישה'
  },
  {
    title: 'מחשבון חיסכון במס',
    url: '/tools/tax-savings/',
    desc: 'כמה מס תחסוך מהפקדה לפנסיה ולקרן השתלמות — לשכיר ולעצמאי.',
    kw: 'מחשבון מס חיסכון פנסיה קרן השתלמות זיכוי ניכוי'
  },
  {
    title: 'מחשבון נדל"ן מול שוק ההון',
    url: '/tools/real-estate-vs-market/',
    desc: 'סימולציית 20 שנה: דירה מול תיק השקעות. כל הפרמטרים ניתנים לכיוון.',
    kw: 'מחשבון נדלן שוק ההון השקעה דירה תיק השקעות השוואה'
  },
  {
    title: 'מחשבון מחיר למשתכן',
    url: '/tools/mechir-lamishtaken/',
    desc: 'סימולטור לדירה בהנחה — הגרלה, זכאות, עלות ריאלית והשוואה לשוק.',
    kw: 'מחיר למשתכן הגרלה זכאות דירה בהנחה סימולטור'
  },
  {
    title: 'מחשבון עלות דמי ניהול',
    url: '/tools/management-fees/',
    desc: 'כמה עולה לך כל 0.1% בדמי ניהול — לאורך 20-30 שנה.',
    kw: 'דמי ניהול מחשבון עלות פנסיה קרן חיסכון'
  },
  {
    title: 'מחשבון ROI ייעוץ פנסיוני',
    url: '/tools/roi-advisor/',
    desc: 'האם הייעוץ משתלם? החישוב שמראה כמה ₪ הייעוץ מייצר ביחס לעלותו.',
    kw: 'ROI ייעוץ פנסיוני כדאיות תשואה עלות תועלת'
  }
];

(function () {
  'use strict';

  function normalize(str) {
    return (str || '').toLowerCase()
      .replace(/[״""'']/g, '')
      .replace(/[\-–—]/g, ' ');
  }

  function searchPages(query) {
    if (!query || query.trim().length < 2) return [];
    var q = normalize(query.trim());
    var words = q.split(/\s+/);
    var results = [];

    SITE_SEARCH_INDEX.forEach(function (page) {
      var haystack = normalize(page.title + ' ' + page.desc + ' ' + page.kw);
      var score = 0;
      words.forEach(function (word) {
        if (haystack.indexOf(word) !== -1) {
          // Higher score for title match
          if (normalize(page.title).indexOf(word) !== -1) score += 3;
          else score += 1;
        }
      });
      if (score > 0) results.push({ page: page, score: score });
    });

    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 6).map(function (r) { return r.page; });
  }

  function renderResults(results, container, query) {
    container.innerHTML = '';
    if (!results.length) {
      var noRes = document.createElement('div');
      noRes.className = 'no-results';
      noRes.textContent = 'לא נמצאו תוצאות עבור "' + query + '"';
      container.appendChild(noRes);
    } else {
      results.forEach(function (page) {
        var a = document.createElement('a');
        a.href = page.url;
        a.innerHTML = '<strong>' + escapeHtml(page.title) + '</strong>' +
                      '<span style="display:block;font-size:12px;color:#777;margin-top:2px">' +
                      escapeHtml(page.desc) + '</span>';
        container.appendChild(a);
      });
    }
    container.classList.add('open');
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function initSearch() {
    var input = document.getElementById('site-search');
    var container = document.getElementById('search-results');
    if (!input || !container) return;

    // Fix placeholder
    input.placeholder = 'חיפוש באתר...';

    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var q = input.value.trim();
        if (q.length < 2) {
          container.classList.remove('open');
          return;
        }
        var results = searchPages(q);
        renderResults(results, container, q);
      }, 160);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!input.closest('.header-search').contains(e.target)) {
        container.classList.remove('open');
      }
    });

    // Close on Escape
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        container.classList.remove('open');
        input.blur();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
