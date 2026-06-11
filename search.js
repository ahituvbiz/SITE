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
  // ── אודות ──
  {
    title: 'אודות איתן אחיטוב — יועץ פנסיוני',
    url: '/about/',
    desc: 'הסיפור שלי: פרשתי מהבנק כדי לעבוד בצד שלך. רישיון נדיר, 6 בחינות, ניסיון 15+ שנה.',
    kw: 'איתן אחיטוב אודות יועץ פנסיוני ביוגרפיה רישיון'
  },
  {
    title: 'יועץ פנסיוני מול מתכנן פיננסי וסוכן ביטוח',
    url: '/about/advisor-vs-planner-vs-agent/',
    desc: 'ההבדל בין יועץ פנסיוני, מתכנן פיננסי וסוכן ביטוח — לא ניואנס, אלא מאות אלפי שקלים.',
    kw: 'יועץ פנסיוני מתכנן פיננסי סוכן ביטוח השוואה הבדל רישיון עמלות מסך עשן'
  },
  {
    title: 'דוגמאות מתוך ייעוצים — סיפורי לקוחות',
    url: '/about/case-studies/',
    desc: 'מקרי בוחן אמיתיים: עצמאי שלא הפקיד, שכיר בכיר עם תיק מבולגן, ועוד.',
    kw: 'סיפורי לקוחות מקרה בוחן ייעוץ פנסיוני דוגמאות'
  },
  {
    title: 'רישיון יועץ פנסיוני — למה זה הנכס הכי חשוב שלך',
    url: '/about/license/',
    desc: 'מה זה רישיון יועץ פנסיוני ממשרד האוצר, איך זה מגן עליך, ולמה יש רק ~100 כאלה בישראל.',
    kw: 'רישיון יועץ פנסיוני משרד האוצר עמלות אובייקטיבי פיקוח רשות שוק ההון'
  },
  {
    title: 'כמה עולה ייעוץ פנסיוני — המחירון השקוף',
    url: '/about/pricing/',
    desc: 'מחירון שקוף לכל מסלול ייעוץ, חישוב ROI, ומה כולל כל מסלול. שיחת אבחון חינם.',
    kw: 'מחיר ייעוץ פנסיוני עלות תשלום ROI כמה עולה שכר טרחה מחירון'
  },
  {
    title: 'יועץ פנסיוני מומלץ — איך לבחור',
    url: '/about/recommended-advisor/',
    desc: '8 שאלות לשאול לפני, איך לבדוק רישיון ברשות שוק ההון, ומה להיזהר ממנו.',
    kw: 'יועץ פנסיוני מומלץ איך לבחור בדיקה רישיון שאלות'
  },
  {
    title: 'המלצות מלקוחות',
    url: '/about/testimonials/',
    desc: 'המלצות אמיתיות מלקוחות על ייעוץ פנסיוני אובייקטיבי — שכירים בכירים, עצמאים וזוגות.',
    kw: 'המלצות לקוחות ביקורות חוות דעת ייעוץ פנסיוני'
  },
  // ── רובייקטיבי ──
  {
    title: 'רובייקטיבי — בדיקת קרן פנסיה ב-60 שניות',
    url: '/ai/',
    desc: 'כלי AI חינמי לניתוח דוח קרן פנסיה: הפקדות, ביטוחים, דמי ניהול, מסלול השקעה.',
    kw: 'רובייקטיבי AI בינה מלאכותית דוח פנסיה ניתוח בדיקה חינם 60 שניות'
  },
  // ── מאמרים ──
  {
    title: 'מרכז הידע הפיננסי',
    url: '/articles/',
    desc: 'מאמרים על פנסיה, ביטוחים, חיסכון ומשכנתאות — הכל בעברית, הכל אובייקטיבי.',
    kw: 'מאמרים ידע פיננסי בלוג כדאי לדעת'
  },
  {
    title: 'נדל"ן או שוק ההון — סימולציה ומסקנות',
    url: '/articles/real-estate-vs-stocks/',
    desc: 'ניתוח אובייקטיבי: תשואה היסטורית, עלויות נסתרות, מינוף, מס — ומה באמת עדיף.',
    kw: 'נדלן שוק ההון השוואה השקעה דירה תיק השקעות תשואה'
  },
  {
    title: 'על מה אתה באמת משלם בייעוץ פנסיוני חינם?',
    url: '/articles/true-cost-free/',
    desc: 'ייעוץ "חינם" מסוכן ביטוח לא באמת חינם — מישהו תמיד משלם. גלה מי, כמה ולמה.',
    kw: 'ייעוץ חינם עלות נסתרת סוכן ביטוח עמלה קונפליקט אינטרסים'
  },
  {
    title: 'למה כדאי לשלם על ייעוץ פנסיוני',
    url: '/articles/why-pay/',
    desc: 'ייעוץ בתשלום מול "חינם" — מה ההבדל, מתי זה כדאי, וכמה זה מחזיר את עצמו.',
    kw: 'ייעוץ פנסיוני תשלום כדאיות למה לשלם ROI'
  },
  // ── קהל יעד ──
  {
    title: 'פנסיה לעצמאים — המדריך המלא 2026',
    url: '/audiences/self-employed/',
    desc: 'פנסיה לעצמאים: חוק החובה, כמה להפקיד, קרן השתלמות, הטבות מס, וטעויות נפוצות.',
    kw: 'פנסיה עצמאי פרילנסר עצמאים חובת הפקדה מס קרן השתלמות'
  },
  {
    title: 'תכנון פיננסי לשכירים בכירים',
    url: '/audiences/senior-employees/',
    desc: 'מיצוי הטבות מס, השוואת תנאי מעסיק, בניית עתודה לפרישה מוקדמת.',
    kw: 'שכיר בכיר שכר גבוה היטק הייטק אופציות RSU מיצוי מס פרישה מוקדמת'
  },
  // ── ביטוחים ──
  {
    title: 'ביטול ביטוח סיעודי — שיקולים לפני שמבטלים',
    url: '/insurance/cancel-siudi/',
    desc: 'ביטול ביטוח סיעודי עלול לעלות ביוקר — לפעמים בלתי הפיך. מה לבדוק לפני.',
    kw: 'ביטוח סיעודי ביטול אובדן ברות כיסוי סיעוד ביטוח בריאות'
  },
  // ── IRA / השקעות ──
  {
    title: 'IRA — קופת גמל והשתלמות בניהול אישי',
    url: '/investment/ira/',
    desc: 'שאלון התאמה אינטראקטיבי, המלצת ברוקר וחישוב עלויות שנתיות. שירות צירוף 890 ₪.',
    kw: 'IRA ניהול אישי קופת גמל קרן השתלמות ברוקר גלובלנט פסגות IBI לאומי מזרחי 890'
  },
  {
    title: 'IRA: למה להעדיף השתלמות, ולמה לא לגעת בפנסיה',
    url: '/investment/ira-explained/',
    desc: 'מדריך IRA מקיף: מתי כן ומתי לא, 5 סיבות לא לגעת בפנסיה, ומה עדיף.',
    kw: 'IRA מדריך מאמר קרן השתלמות גמל פנסיה אסור אכע שאירים אגח מיועדות'
  },
  {
    title: 'עמלות ברוקרים IRA — השוואה מלאה',
    url: '/investment/ira-fees/',
    desc: 'טבלת עמלות מלאה: פסגות, IBI, מזרחי, הבינלאומי, לאומי, הפועלים. ישראל וחו"ל.',
    kw: 'עמלות IRA ברוקר פסגות IBI מזרחי הבינלאומי לאומי הפועלים גלובלנט'
  },
  {
    title: 'כללי השקעה רגולטוריים ב-IRA',
    url: '/investment/ira-investment-rules/',
    desc: 'מה מותר ומה אסור ב-IRA לפי תקנות 2009 + טיוטת תקנות 2025 מהאוצר.',
    kw: 'IRA כללי השקעה רגולציה תקנות 2025 מגבלות ריכוז כסף פנסיוני אסור'
  },
  {
    title: 'יתרון דחיית המס ב-IRA',
    url: '/investment/ira-tax-deferral/',
    desc: 'איך ריבית דריבית על "כסף המס" יוצרת הפרש של 500,000 ₪ לאורך 30 שנה.',
    kw: 'דחיית מס IRA ריבית דריבית רווחי הון מס מיסוי השקעות 500000'
  },
  {
    title: 'מדד S&P 500: למה לא לשים עליו הכל',
    url: '/investment/why-not-sp500/',
    desc: 'ריכוזיות 10 החברות, הימור על מדינה ומטבע אחד, והעיוות של שקלול שווי שוק — למה פיזור רחב עדיף.',
    kw: 'S&P 500 סנופי מדד מסלול מחקה פיזור מדד עולמי MSCI דולר מטח ריכוזיות משקל שווה'
  },
  // ── משכנתא ──
  {
    title: 'משכנתא ופנסיה — תכנון פיננסי הוליסטי',
    url: '/mortgage/mortgage-and-pension/',
    desc: 'למה משכנתא ופנסיה חייבים להיות מתוכננים יחד — ולא בנפרד. שילוב שני התיקים.',
    kw: 'משכנתא פנסיה שילוב תכנון פיננסי הוליסטי בית דירה'
  },
  // ── מוצרי פנסיה ──
  {
    title: 'מוצרי פנסיה — המדריך המלא',
    url: '/pension/',
    desc: 'קרן פנסיה מקיפה ומשלימה, ביטוח מנהלים, קופת גמל — מה ההבדלים ומה עדיף.',
    kw: 'פנסיה קרן פנסיה ביטוח מנהלים קופת גמל מוצרי פנסיה'
  },
  {
    title: 'כמה להפקיד לפנסיה כשכיר?',
    url: '/pension/contribution-employee/',
    desc: 'חובת ההפקדה לפי חוק, המינימום שמשתלם (18.5%), הטבות המס ומתי כדאי להגדיל.',
    kw: 'הפקדה פנסיה שכיר חובה 18.5% מינימום הטבות מס מעסיק עובד'
  },
  {
    title: 'קרן פנסיה מקיפה — מה זה ולמי זה מתאים',
    url: '/pension/keren-pensya-mekifa/',
    desc: 'המוצר הפנסיוני המשתלם ביותר לרוב הציבור. המבנה, היתרונות, החסרונות.',
    kw: 'קרן פנסיה מקיפה מסלולים אגח מיועדות כיסוי ביטוחי אכע שאירים'
  },
  {
    title: 'קרן פנסיה מקיפה מול משלימה — איזו לבחור?',
    url: '/pension/mekifa-vs-mashlima/',
    desc: 'ההבדל המהותי, תקרות ההפקדה, מי חייב מקיפה ומתי משלימה הופכת רלוונטית.',
    kw: 'קרן פנסיה מקיפה משלימה הבדל תקרה ביטוח מנהלים השוואה'
  },
  // ── חיסכון ──
  {
    title: 'גמל להשקעה — האם זה כדאי לך?',
    url: '/savings/gamal-lehashkaa/',
    desc: 'מה זה גמל להשקעה, למי זה מתאים, ומה ההבדל מחיסכון רגיל. מדריך מלא.',
    kw: 'גמל להשקעה חיסכון קופת גמל השקעה תשואה מס פרישה'
  },
  {
    title: 'חיסכון לכל ילד — המדריך המלא',
    url: '/savings/hisachon-layeled/',
    desc: 'ביטוח לאומי מפקיד 58 ₪ בחודש. בנק מול קופת גמל, הכפלה, ומה שווה פי 100 ממנו.',
    kw: 'חיסכון לכל ילד ביטוח לאומי הכפלה קופת גמל בנק מענק גיל 18 21 58 שקל'
  },
  {
    title: 'איך קונים קרן כספית בפועל',
    url: '/savings/how-to-buy-keren-kaspit/',
    desc: 'מדריך צעד אחר צעד: בחירת קרן, פתיחת חשבון מסחר בבנק, ביצוע הרכישה.',
    kw: 'קרן כספית קניה בנק חשבון מסחר צעד צעד'
  },
  {
    title: 'קרן השתלמות — המדריך השלם 2026',
    url: '/savings/keren-hishtalmut/',
    desc: 'האפיק היחיד הפטור ממס רווחי הון. מדריך לשכירים ועצמאים: הפקדה, תקרה, משיכה.',
    kw: 'קרן השתלמות שכיר עצמאי פטור מס רווחי הון הפקדה תקרה משיכה 6 שנים'
  },
  {
    title: 'קרן כספית — המדריך השלם',
    url: '/savings/keren-kaspit/',
    desc: 'מה זה, יתרון מס ריאלי, 4 סוגי קרנות (שקלית, מט"חית, ללא קונצרני, מחלקת), איך קונים.',
    kw: 'קרן כספית פיקדון ריבית מס ריאלי שקלית מטח קונצרני מחלקת תשואה'
  },
  {
    title: 'להתחיל לחסוך לפנסיה מוקדם — כמה שווה כל שנה',
    url: '/savings/start-saving-early/',
    desc: 'ריבית דריבית היא הנשק של מי שמתחיל מוקדם. חישוב: התחלה בגיל 25 vs 35.',
    kw: 'חיסכון מוקדם פנסיה גיל צעיר ריבית דריבית 25 35 חסכון מוקדם'
  },
  // ── מחשבונים ──
  {
    title: 'מחשבונים פיננסיים — מרכז הכלים',
    url: '/tools/',
    desc: '6 מחשבונים חינמיים: פנסיה לעצמאים, חיסכון במס, נדל"ן מול שוק, דמי ניהול ו-ROI.',
    kw: 'מחשבון פיננסי כלים פנסיה עצמאי מס נדלן שוק ההון דמי ניהול ROI'
  },
  {
    title: 'מחשבון עלות דמי ניהול',
    url: '/tools/management-fees/',
    desc: 'כמה עולה לך כל 0.1% בדמי ניהול — בריבית-דריבית על עשרות שנות צבירה.',
    kw: 'דמי ניהול מחשבון עלות הפרש פנסיה קרן חיסכון 0.1%'
  },
  {
    title: 'סימולטור מחיר למשתכן',
    url: '/tools/mechir-lamishtaken/',
    desc: 'הגרלה, זכאות, מחיר ריאלי ביחס לשוק — ומה קורה לכסף שחסכת אם תשקיע אותו.',
    kw: 'מחיר למשתכן הגרלה זכאות דירה בהנחה סימולטור'
  },
  {
    title: 'מחשבון פנסיה לעצמאים',
    url: '/tools/pension-calc-self-employed/',
    desc: 'חישוב הפקדה מומלצת, חיסכון במס ותחזית צבירה לפרישה — לעצמאי ופרילנסר.',
    kw: 'מחשבון פנסיה עצמאי פרילנסר הפקדה מס צבירה פרישה סימולטור'
  },
  {
    title: 'מחשבון נדל"ן מול שוק ההון',
    url: '/tools/real-estate-vs-market/',
    desc: 'סימולציית 5–40 שנה: דירה מול תיק השקעות. שכירות, מינוף, עליית ערך, מס.',
    kw: 'מחשבון נדלן שוק ההון השקעה דירה תיק השקעות השוואה סימולטור'
  },
  {
    title: 'מחשבון ROI ייעוץ פנסיוני',
    url: '/tools/roi-advisor/',
    desc: 'האם ייעוץ פנסיוני משתלם? מחשב 3 נדבכים: דמי ניהול + תשואה + ביטוחים.',
    kw: 'ROI ייעוץ פנסיוני כדאיות תשואה עלות תועלת מחשבון פי 50'
  },
  {
    title: 'מחשבון חיסכון במס',
    url: '/tools/tax-savings/',
    desc: 'כמה מס תחסוך מהפקדה לפנסיה ולקרן השתלמות — לשכיר ולעצמאי.',
    kw: 'מחשבון מס חיסכון פנסיה קרן השתלמות זיכוי ניכוי הטבת מס'
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
          if (normalize(page.title).indexOf(word) !== -1) score += 3;
          else score += 1;
        }
      });
      if (score > 0) results.push({ page: page, score: score });
    });

    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 7).map(function (r) { return r.page; });
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
        a.innerHTML =
          '<strong>' + escapeHtml(page.title) + '</strong>' +
          '<span style="display:block;font-size:12px;color:#777;margin-top:2px">' +
          escapeHtml(page.desc) + '</span>';
        container.appendChild(a);
      });
    }
    container.classList.add('open');
  }

  function initSearch() {
    var input = document.getElementById('site-search');
    var container = document.getElementById('search-results');
    if (!input || !container) return;

    input.placeholder = 'חיפוש באתר...';

    var debounceTimer;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var q = input.value.trim();
        if (q.length < 2) { container.classList.remove('open'); return; }
        renderResults(searchPages(q), container, q);
      }, 160);
    });

    document.addEventListener('click', function (e) {
      var wrap = input.closest('.header-search');
      if (wrap && !wrap.contains(e.target)) container.classList.remove('open');
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { container.classList.remove('open'); input.blur(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
