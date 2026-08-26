/**
 * pensya.info — חיפוש אתר-רחב (v3, 27.8.26)
 *
 * האינדקס נגזר אוטומטית מהדפים עצמם ע"י build-search-index.py בכל פריסה,
 * ונטען בעצלתיים (/search-index.json) רק כשהמשתמש נוגע בתיבת החיפוש.
 * הקובץ הזה מכיל את המנוע בלבד — אין בו רשימת דפים ואין מה לתחזק בו ידנית,
 * פרט לטבלת המילים הנרדפות שלמטה.
 *
 * מייצא: window.PensyaSearch.query(str) -> [{title,url,desc,heading,score}]
 */
(function () {
  'use strict';

  var INDEX_URL = '/search-index.json';
  var FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  /* מילים נרדפות — מה שהגולש מקליד מול מה שכתוב בדפים */
  var SYNONYMS = {
    'מורים': 'הוראה חינוך', 'מורה': 'הוראה חינוך', 'מורות': 'הוראה חינוך',
    'הוראה': 'מורים חינוך', 'גננת': 'הוראה מורים', 'גננות': 'הוראה מורים',
    'שבתון': 'הוראה מורים השתלמות',
    'סנופי': 's&p 500 מדד', 'snp': 's&p 500', 'ספי': 's&p 500',
    'עמלה': 'עמלות ניהול', 'מחיר': 'עלות מחירון', 'עולה': 'מחיר עלות',
    'הייטק': 'היטק', 'היטק': 'הייטק',
    'נדלן': 'דירה נדל"ן', 'דירה': 'נדלן', 'משכנתה': 'משכנתא',
    'קצבה': 'פנסיה מקדם', 'ילדים': 'ילד', 'סיעוד': 'סיעודי',
    'פנסיוני': 'פנסיה', 'חסכון': 'חיסכון', 'השתלמות': 'הישתלמות'
  };

  var STOP = ('של את על עם לא זה זו הוא היא הם הן אני אתה אנחנו מה מי יש אין אם כי גם ' +
    'כל או אבל אז רק עוד כבר אחרי לפני בין תחת אצל כמו כדי מאוד יותר פחות אשר היה היו ' +
    'להיות כן ולא וגם אך שלא שהוא בו בה בהם אותו אותה זאת אלה כאן שם עכשיו איך למה מתי כמה'
  ).split(' ').reduce(function (a, w) { a[w] = 1; return a; }, {});

  var DATA = null, LOADING = null;

  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (LOADING) return LOADING;
    LOADING = fetch(INDEX_URL, { cache: 'default' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) { DATA = j; return j; })
      .catch(function (e) { LOADING = null; throw e; });
    return LOADING;
  }

  function normalize(str) {
    return (str || '')
      .replace(/[֑-ׇ]/g, '')
      .replace(/[״”“"'’‘׳]/g, '')
      .replace(/[^0-9A-Za-z֐-׿&%]+/g, ' ')
      .toLowerCase().trim();
  }

  /* סדר הפעולות קריטי: קילוף הסיומת לפני נרמול האות הסופית, אחרת "מורים"
     הופך ל-"מורימ" והסיומת "ים" כבר לא מזוהה. חייב להיות זהה ל-stem()
     שב-build-search-index.py, אחרת האינדקס והשאילתה לא נפגשים. */
  function stem(w) {
    if (w.length >= 4) w = w.replace(/(ויות|יות|ים|ות|יה|ה|ת|י)$/, '');
    w = w.replace(/[ךםןףץ]/g, function (c) { return FINALS[c]; });
    var g = 0;
    while (w.length >= 5 && 'והבכלמש'.indexOf(w[0]) !== -1 && g < 2) { w = w.slice(1); g++; }
    return w;
  }

  function queryTerms(q) {
    var words = normalize(q).split(' ').filter(function (w) { return w.length >= 2 && !STOP[w]; });
    var out = [], seen = {};
    function push(w, boost, noFuzzy) {
      var s = stem(w);
      if (s.length < 2 || seen[s]) return;
      seen[s] = 1; out.push({ s: s, boost: boost, noFuzzy: !!noFuzzy });
    }
    words.forEach(function (w) {
      // למילה שיש לה נרדפות מפורשות אין טעם בתיקון-שגיאות: הוא רק מייצר רעש
      push(w, 1, !!(SYNONYMS[w] || SYNONYMS[stem(w)]));
    });
    words.forEach(function (w) {
      var syn = SYNONYMS[w] || SYNONYMS[stem(w)];
      if (syn) normalize(syn).split(' ').forEach(function (x) { push(x, 0.9, true); });
    });
    return out;
  }

  /* מרחק דמראו-לוינשטיין <= 1 — החלפה, הוספה, השמטה או שיכול שתי אותיות
     ("השתמלות" -> "השתלמות"), שהוא רוב שגיאות ההקלדה בעברית. */
  function near(a, b) {
    if (a === b) return true;
    var la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    var i = 0;
    while (i < la && i < lb && a[i] === b[i]) i++;
    if (i === la && i === lb) return true;
    var ea = la - 1, eb = lb - 1;
    while (ea >= i && eb >= i && a[ea] === b[eb]) { ea--; eb--; }
    if (la === lb) {
      if (ea === i && eb === i) return true;                       // החלפת אות
      if (ea === i + 1 && eb === i + 1 &&
          a[i] === b[i + 1] && a[i + 1] === b[i]) return true;     // שיכול
      return false;
    }
    return (la > lb) ? (ea === i && eb === i - 1) : (eb === i && ea === i - 1);
  }

  function lookup(term, allowFuzzy) {
    var idx = DATA.i, hit = idx[term];
    if (hit) return [hit];
    var out = [], k;
    if (term.length >= 3) {
      for (k in idx) if (k.length > term.length && k.indexOf(term) === 0) out.push(idx[k]);
      if (out.length) return out;
    }
    if (allowFuzzy && term.length >= 4) {
      for (k in idx) if (near(term, k)) out.push(idx[k]);
    }
    return out;
  }

  function query(q) {
    if (!DATA || !q || normalize(q).length < 2) return [];
    var terms = queryTerms(q);
    if (!terms.length) return [];
    var acc = {};
    terms.forEach(function (t) {
      var best = {};
      lookup(t.s, !t.noFuzzy).forEach(function (entry) {
        var idf = entry[0];
        entry[1].forEach(function (pw) {
          var v = pw[1] * idf * t.boost;
          if (!(pw[0] in best) || v > best[pw[0]]) best[pw[0]] = v;
        });
      });
      for (var pi in best) {
        var a = acc[pi] || (acc[pi] = { s: 0, m: 0 });
        a.s += best[pi];
        if (t.boost === 1) a.m++;
      }
    });
    var core = terms.filter(function (t) { return t.boost === 1; }).length;
    var res = [];
    for (var pi in acc) {
      var page = DATA.p[pi], a = acc[pi];
      if (core > 1 && a.m === core) a.s *= 1.6;
      res.push({ title: page.t, url: page.u, desc: page.d,
                 heading: matchHeading(page, terms), score: a.s, matched: a.m });
    }
    res.sort(function (x, y) { return y.matched - x.matched || y.score - x.score; });
    return res;
  }

  /* אם מונח החיפוש יושב בכותרת פרק בתוך הדף — מציגים אותה כהקשר */
  function matchHeading(page, terms) {
    if (!page.h) return '';
    for (var i = 0; i < page.h.length; i++) {
      var hs = normalize(page.h[i]).split(' ').map(stem);
      for (var j = 0; j < terms.length; j++) {
        if (terms[j].boost < 1) continue;
        for (var k = 0; k < hs.length; k++) {
          if (hs[k] === terms[j].s || (terms[j].s.length >= 3 && hs[k].indexOf(terms[j].s) === 0)) return page.h[i];
        }
      }
    }
    return '';
  }

  function track(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {}
  }

  /* ── ממשק תיבת החיפוש בהדר ── */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initSearch() {
    var input = document.getElementById('site-search');
    var container = document.getElementById('search-results');
    if (!input || !container) return;
    input.placeholder = 'חיפוש באתר...';
    input.setAttribute('autocomplete', 'off');

    var warm = function () { load().catch(function () {}); };
    input.addEventListener('focus', warm, { once: true });
    input.addEventListener('input', function () {
      warm();
      clearTimeout(timer);
      timer = setTimeout(run, 140);
    });
    var timer;

    function run() {
      var q = input.value.trim();
      if (q.length < 2) { container.classList.remove('open'); return; }
      load().then(function () { render(q); }).catch(function () {
        container.innerHTML = '<div class="no-results">החיפוש אינו זמין כרגע. נסו לרענן את הדף.</div>';
        container.classList.add('open');
      });
    }

    function render(q) {
      var all = query(q), res = all.slice(0, 7);
      container.innerHTML = '';
      if (!res.length) {
        track('search_no_results', { search_term: q });
        var no = document.createElement('div');
        no.className = 'no-results';
        no.innerHTML = 'לא נמצאו תוצאות עבור "' + escapeHtml(q) + '".' +
          '<span style="display:block;font-size:12px;color:#777;margin-top:6px">' +
          'אפשר לנסות מילה אחרת, או לעבור ל<a href="/articles/" style="text-decoration:underline">מרכז הידע</a>' +
          ' ול<a href="/tools/" style="text-decoration:underline">מחשבונים</a>.</span>';
        container.appendChild(no);
      } else {
        track('search', { search_term: q, results: all.length });
        res.forEach(function (r) {
          var a = document.createElement('a');
          a.href = r.url;
          a.innerHTML = '<strong>' + escapeHtml(r.title) + '</strong>' +
            '<span style="display:block;font-size:12px;color:#777;margin-top:2px">' +
            escapeHtml(r.heading ? '· ' + r.heading : r.desc) + '</span>';
          container.appendChild(a);
        });
        if (all.length > res.length) {
          var more = document.createElement('a');
          more.href = '/search/?q=' + encodeURIComponent(q);
          more.innerHTML = '<strong style="font-size:13px">כל ' + all.length + ' התוצאות ←</strong>';
          container.appendChild(more);
        }
      }
      container.classList.add('open');
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { container.classList.remove('open'); input.blur(); }
      if (e.key === 'Enter') {
        var q = input.value.trim();
        if (q.length >= 2) { e.preventDefault(); location.href = '/search/?q=' + encodeURIComponent(q); }
      }
    });

    document.addEventListener('click', function (e) {
      var wrap = input.closest('.header-search');
      if (wrap && !wrap.contains(e.target)) container.classList.remove('open');
    });
  }

  window.PensyaSearch = { load: load, query: query, stem: stem, normalize: normalize, track: track };

  if (typeof module !== 'undefined' && module.exports) module.exports = window.PensyaSearch;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSearch);
    else initSearch();
  }
})();
