#!/usr/bin/env node
/**
 * seo-links.js — קישורים פנימיים אוטומטיים לאתר pensya.info
 *
 * הסקריפט סורק את כל קבצי ה-HTML בריפו ומוסיף קישורים פנימיים
 * לפי KEYWORD_MAP. הוא האחראי הבלעדי על קישורים פנימיים —
 * אין להוסיף קישורים פנימיים ידנית בקבצי המקור.
 *
 * שימוש: node seo-links.js [נתיב לתיקיית ה-SITE]
 * דוגמה: node seo-links.js ../SITE
 *
 * כללים:
 * - מקשר רק את המופע הראשון של כל מילת מפתח בכל דף
 * - לא מקשר בתוך כותרות (h1–h4)
 * - לא מקשר טקסט שכבר בתוך <a>
 * - לא מקשר דף לעצמו
 * - לא מקשר בתוך <title>, <meta>, <script>, <style>
 */

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// KEYWORD_MAP — מקור האמת לכל הקישורים הפנימיים
// מבנה: { 'מילת מפתח': '/url/היעד/' }
// כשיש כמה מילות מפתח לאותו URL — שורה לכל ביטוי.
// מילות מפתח ארוכות יותר כתובות ראשונות (מניעת חפיפות).
// ─────────────────────────────────────────────
const KEYWORD_MAP = {

  // ── פילר 1: מוצרי פנסיה ──
  'מה עדיף קרן פנסיה מקיפה או משלימה': '/pension/mekifa-vs-mashlima/',
  'קרן פנסיה מקיפה מול משלימה':        '/pension/mekifa-vs-mashlima/',
  // 'מסלולי השקעה פנסיוניים': דף טרם נבנה — /pension/investment-tracks/
  // 'מסלול השקעה בפנסיה': דף טרם נבנה
  // 'מסלול השקעה לפי גיל': דף טרם נבנה — /pension/investment-by-age/
  // 'ניוד קרן פנסיה': דף טרם נבנה — /pension/niud/
  // 'השוואת קרנות פנסיה': דף טרם נבנה — /pension/hashvaot-kranot/
  // 'דמי ניהול בפנסיה': דף טרם נבנה — /pension/dmei-nihul/
  // 'ביטוח מנהלים': דף טרם נבנה — /pension/bituach-menahalim/
  // 'גמל פנסיוני': דף טרם נבנה — /pension/gamal-pensyoni/
  'קרן פנסיה מקיפה':                    '/pension/keren-pensya-mekifa/',
  // 'קרן פנסיה משלימה': דף טרם נבנה — /pension/keren-pensya-mashlima/
  'מוצרי פנסיה':                         '/pension/',
  'כמה להפקיד לפנסיה':                  '/pension/contribution-employee/',

  // ── פילר 2: חיסכון ──
  // 'קרן השתלמות לשכיר': דף טרם נבנה — /savings/keren-hishtalmut-sakhir/
  // 'קרן השתלמות לעצמאי': דף טרם נבנה — /savings/keren-hishtalmut-atzmai/
  'קרן השתלמות אחרי 6 שנים':            '/savings/keren-hishtalmut/',
  'קרן השתלמות':                         '/savings/keren-hishtalmut/',
  'איך קונים קרן כספית':                '/savings/how-to-buy-keren-kaspit/',
  'חיסכון לכל ילד':                      '/savings/hisachon-layeled/',
  'להתחיל לחסוך לפנסיה מוקדם':          '/savings/start-saving-early/',
  'גמל להשקעה':                          '/savings/gamal-lehashkaa/',
  // 'פוליסת חיסכון': דף טרם נבנה — /savings/polisa-hisachon/
  'קרן כספית':                           '/savings/keren-kaspit/',

  // ── פילר 3: ביטוחים ──
  'ביטול ביטוח סיעודי':                 '/insurance/cancel-siudi/',
  // 'ביטוח סיעוד': דף טרם נבנה — /insurance/siud/
  // 'ביטוח בריאות פרטי': דף טרם נבנה — /insurance/bituach-briut/
  // 'אובדן כושר עבודה': דף טרם נבנה — /insurance/okd/
  // 'ביטוח חיים': דף טרם נבנה — /insurance/bituach-chaim/
  // 'כפילויות בביטוחים': דף טרם נבנה — /insurance/kfiliuyot/
  // 'בדיקת ביטוחים': דף טרם נבנה — /insurance/

  // ── פילר 4: משכנתא ──
  'משכנתא ופנסיה':                       '/mortgage/mortgage-and-pension/',
  // 'ייעוץ משכנתאות': דף טרם נבנה — /mortgage/
  'מחיר למשתכן':                         '/tools/mechir-lamishtaken/',
  'נדל"ן או שוק ההון':                   '/articles/real-estate-vs-stocks/',
  'נדלן מול שוק ההון':                   '/articles/real-estate-vs-stocks/',

  // ── פילר 5: קהל יעד ──
  'פנסיה לעצמאים':                       '/audiences/self-employed/',
  'תכנון פיננסי לעצמאים':               '/audiences/self-employed/',
  'תכנון פיננסי לשכירים בכירים':        '/audiences/senior-employees/',
  // 'תכנון פיננסי לזוגות צעירים': דף טרם נבנה — /audiences/young-couples/
  // 'תכנון פיננסי משפחתי': דף טרם נבנה — /audiences/family/
  // 'יועץ פנסיוני לעובדי מדינה': דף טרם נבנה — /audiences/gov-employees/

  // ── פילר 6: מאמרים ──
  // 'הורדת דוח פנסיה שנתי': דף טרם נבנה — /articles/how-to-get-pension-report/
  // 'איך קוראים דוח פנסיה': דף טרם נבנה — /articles/how-to-read-pension-report/
  // 'הטבות מס בחיסכון פנסיוני': דף טרם נבנה — /articles/tax-benefits/
  // 'ריבית דריבית': דף טרם נבנה — /articles/compound-interest/
  // 'מילון מונחים פנסיוני': דף טרם נבנה — /articles/glossary/
  'ייעוץ פנסיוני בתשלום':               '/articles/why-pay/',
  'למה לשלם על ייעוץ פנסיוני':          '/articles/why-pay/',
  'ייעוץ פנסיוני חינם':                  '/articles/true-cost-free/',

  // ── פילר 7: כלים ──
  'מחשבון פנסיה לעצמאים':               '/tools/pension-calc-self-employed/',
  'מחשבון חיסכון במס':                   '/tools/tax-savings/',
  'מחשבון דמי ניהול':                    '/tools/management-fees/',
  'מחשבון נדל"ן':                        '/tools/real-estate-vs-market/',
  'מחשבון ROI ייעוץ':                    '/tools/roi-advisor/',
  'מחשבונים פיננסיים':                   '/tools/',

  // ── פילר 8: אודות ──
  'יועץ פנסיוני מומלץ':                  '/about/recommended-advisor/',
  'יועץ פנסיוני בלתי תלוי':             '/about/recommended-advisor/',
  'רישיון יועץ פנסיוני':                '/about/license/',
  'יועץ פנסיוני מורשה':                  '/about/license/',
  'כמה עולה ייעוץ פנסיוני':             '/about/pricing/',
  'מחירון ייעוץ פנסיוני':               '/about/pricing/',
  'יועץ פנסיוני מול מתכנן פיננסי':      '/about/advisor-vs-planner-vs-agent/',
  'סיפורי לקוחות':                       '/about/case-studies/',
  'המלצות לקוחות':                       '/about/testimonials/',
  // 'פגישה עם יועץ פנסיוני': דף טרם נבנה — /about/meeting/

  // ── פילר 9: מוצרי השקעה (IRA) ──
  'כללי ההשקעה ב-IRA':                   '/investment/ira-investment-rules/',
  'כללי השקעה ב-IRA':                    '/investment/ira-investment-rules/',
  'עמלות ברוקרים IRA':                   '/investment/ira-fees/',
  'דחיית מס ב-IRA':                      '/investment/ira-tax-deferral/',
  'IRA בישראל':                          '/investment/ira-explained/',
  'קופת גמל בניהול אישי':               '/investment/ira/',
  'קרן השתלמות בניהול אישי':            '/investment/ira/',
  'IRA':                                 '/investment/ira/',

  // ── AI / רובייקטיבי ──
  'בדיקת קרן פנסיה':                    '/ai/',
  'ניתוח דוח פנסיה':                    '/ai/',
  'רובייקטיבי':                          '/ai/',
};

// ─────────────────────────────────────────────
// פונקציות עזר
// ─────────────────────────────────────────────

/** מחזיר את ה-URL של הדף לפי נתיב הקובץ */
function fileToUrl(filePath, siteRoot) {
  const rel = path.relative(siteRoot, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return '/';
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '/');
}

/** בודק אם כתובת ה-URL של הקישור זהה לדף הנוכחי */
function isSelfLink(targetUrl, currentUrl) {
  return targetUrl === currentUrl || targetUrl === currentUrl.replace(/\/$/, '');
}

/**
 * מוסיף קישורים פנימיים ל-HTML.
 * עובד על ה-body בלבד, מחוץ לתגי: a, h1–h4, title, script, style, code, pre.
 */
function addInternalLinks(html, currentUrl) {
  // מיין מילות מפתח לפי אורך יורד (ביטויים ארוכים קודם)
  const keywords = Object.keys(KEYWORD_MAP).sort((a, b) => b.length - a.length);
  const used = new Set(); // מילות מפתח שכבר קושרו בדף זה

  // פצל את ה-HTML לחלקים: תגים וטקסט
  // החלפה רק בטקסט שאינו בתוך תגים מוגנים
  let result = html;
  let inProtected = 0; // מונה תגים מוגנים פתוחים
  const protectedTags = /^(a|h1|h2|h3|h4|title|script|style|code|pre|noscript)$/i;

  // שיטה: עיבוד הטקסט חלק-חלק עם regex על ה-HTML כולו
  result = result.replace(
    /(<[^>]+>)|([^<]+)/g,
    (match, tag, text) => {
      if (tag) {
        // עדכן מונה תגים מוגנים
        const tagName = (tag.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/) || [])[1] || '';
        if (protectedTags.test(tagName)) {
          if (tag.startsWith('</')) {
            inProtected = Math.max(0, inProtected - 1);
          } else if (!tag.endsWith('/>')) {
            inProtected++;
          }
        }
        return tag;
      }

      // טקסט רגיל — מחוץ לתגים מוגנים
      if (inProtected > 0 || !text.trim()) return text;

      let processed = text;
      for (const kw of keywords) {
        if (used.has(kw)) continue;
        const targetUrl = KEYWORD_MAP[kw];
        if (isSelfLink(targetUrl, currentUrl)) continue;

        // חיפוש case-insensitive עם גבולות מילה (תומך בעברית)
        const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'i');

        if (regex.test(processed)) {
          processed = processed.replace(regex, `<a href="${targetUrl}">$1</a>`);
          used.add(kw);
        }
      }
      return processed;
    }
  );

  return result;
}

/** אוסף רקורסיבית את כל קבצי ה-HTML בתיקייה */
function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      files.push(...collectHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

// ─────────────────────────────────────────────
// ריצה ראשית
// ─────────────────────────────────────────────
const siteRoot = path.resolve(process.argv[2] || '.');
console.log(`\n🔗 seo-links.js — pensya.info`);
console.log(`📁 תיקיית SITE: ${siteRoot}\n`);

if (!fs.existsSync(siteRoot)) {
  console.error(`❌ תיקייה לא נמצאה: ${siteRoot}`);
  process.exit(1);
}

const htmlFiles = collectHtmlFiles(siteRoot);
console.log(`📄 נמצאו ${htmlFiles.length} קבצי HTML\n`);

let totalLinks = 0;

for (const filePath of htmlFiles) {
  const currentUrl = fileToUrl(filePath, siteRoot);
  const original   = fs.readFileSync(filePath, 'utf8');
  const updated    = addInternalLinks(original, currentUrl);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    // ספור כמה קישורים נוספו
    const added = (updated.match(/<a href="\/[^"]+">(?!.*<\/a>)/g) || []).length -
                  (original.match(/<a href="\/[^"]+">(?!.*<\/a>)/g) || []).length;
    console.log(`  ✅ ${currentUrl} — נוספו קישורים`);
    totalLinks++;
  }
}

console.log(`\n✨ סיום — עודכנו ${totalLinks} דפים`);
console.log(`כל הקישורים הפנימיים מנוהלים על ידי KEYWORD_MAP.
`);