#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-html.py — בדיקת תקינות קבצי HTML לפני פריסה ל-pensya.info.
נועד למנוע דחיפה של קבצים פגומים/קטועים (באג ה-mount, ראה CONTEXT v4.8/v5.5).

שימוש:
    python3 check-html.py file1.html file2.html ...   # בודק קבצים מסוימים (מומלץ: רק מה שמשתנה)
    python3 check-html.py --all                        # אודיט מלא של כל קבצי ה-HTML בריפו

בדיקות פר-קובץ (FAIL = חוסם):
  1. אפס בייטי NUL (\\x00)          — חתימה מובהקת של קובץ פגום
  2. UTF-8 תקין                     — אין בייטים שבורים
  3. איזון תגיות בלוק                — div / section / article / details / svg
     (אחרי הסרת <script>, <style> והערות, כדי לא לספור תגיות בתוך JS/CSS)

בדיקת שלמות פוטר לכל האתר (FAIL = חוסם) — רצה תמיד, גם כשמריצים על קבצים בודדים:
  5. לכל דף תוכן חייב להיות בדיוק <footer class="site-footer"> אחד,
     והוא חייב להיות בראש ה-body ולא "בלוע" בתוך אלמנט תוכן שלא נסגר.
     (זו בדיוק התקלה שגרמה לפוטר להיראות שונה בדפים שונים.)

בדיקה (WARN = לא חוסם):
  4. הקובץ אינו נגמר ב-</html>       — חלק מהדפים נגמרים ב-</footer> בכוונה (קונבנציה)

יציאה: 0 אם אין FAIL, 1 אם קובץ כלשהו נכשל.
"""
import sys, os, re, subprocess

BLOCK_TAGS = ["div", "section", "article", "details", "svg"]

# דפים שמותר להם לא לכלול פוטר אחיד (אזור לקוחות + דאטה מוטמע)
FOOTER_EXEMPT = ("clients/", "game/", "private/", "lecture/")   # private/ — האזור האישי, ללא chrome ציבורי (25.8.26)

# ---- דף ההרצאה המאוחד (lecture/) -------------------------------------------
# הקובץ הזה הוא HTML יחיד שמכיל את כל דפי ההרצאה בבלוקי <script type="text/html">.
# בדיקת המבנה הרגילה עיוורת אליו (strip_noise מסיר בלוקי script), ולכן יש לו
# שער משלו שרץ אוטומטית בכל פריסה. אין מה להריץ ידנית.
LECTURE_PAGES = ("advisor", "needle", "flow", "insurance", "returns")
LECTURE_FORBIDDEN = ["מנורה משלימה", '"mash":true']

def lecture_check(path):
    fails = []
    try:
        t = open(path, encoding="utf-8").read()
    except Exception as e:
        return [f"לא ניתן לקרוא: {e}"]
    for term in LECTURE_FORBIDDEN:                       # 1. תוכן חסוי — הקריטי
        if term in t: fails.append(f'תוכן חסוי בקובץ: "{term}"')
    n = len(re.findall(r'<script type="text/html" id="pg-(?:%s)">' % "|".join(LECTURE_PAGES), t))
    if n != 5:                                           # 2. שלמות הקידוד
        fails.append(f"נמצאו {n} בלוקי דפים במקום 5 (עריכה שברה את הקובץ?)")
    for k in LECTURE_PAGES:                              # 3. כל דף שלם
        m = re.search(r'<script type="text/html" id="pg-%s">(.*?)</script>\s*(?=\n\n<!-- =|\n<script>)' % k, t, re.S)
        if not m: fails.append("חסר או שבור בלוק הדף: " + k); continue
        b = m.group(1)
        if 'class="lecnav"' not in b:  fails.append("אין סרגל ניווט בדף " + k)
        if 'name="robots"' not in b:   fails.append("חסר noindex בדף " + k)
        if len(b) < 5000:              fails.append(f"הדף {k} קצר בצורה חשודה ({len(b)} תווים)")
    for bad, why in [("fonts.googleapis.com", "הפונט צריך להיות מוטמע"),
                     ("cdnjs.cloudflare.com", "Chart.js צריך להיות מוטמע")]:
        if bad in t: fails.append(f"נשארה תלות חיצונית ({bad}) — {why}")
    if 'name="robots" content="noindex' not in t.split("<body>")[0]:
        fails.append("חסר noindex במעטפת הקובץ")
    return fails


def all_html():
    try:
        out = subprocess.check_output(["git", "ls-files", "*.html"], text=True)
        f = [x for x in out.splitlines() if x.strip()]
        if f: return f
    except Exception:
        pass
    res = []
    for root, _, names in os.walk("."):
        if "/.git" in root: continue
        res += [os.path.join(root, n) for n in names if n.endswith(".html")]
    return res

def strip_noise(t):
    t = re.sub(r"<script\b.*?</script>", "", t, flags=re.S | re.I)
    t = re.sub(r"<style\b.*?</style>", "", t, flags=re.S | re.I)
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    return t

def block_balance(text, tag):
    o = len(re.findall(r"<" + tag + r"[\s>]", text, re.I))
    c = len(re.findall(r"</" + tag + r">", text, re.I))
    return o, c

def check_file(path):
    fails, warns = [], []
    try:
        raw = open(path, "rb").read()
    except Exception as e:
        return [f"לא ניתן לקרוא: {e}"], []
    if b"\x00" in raw:
        fails.append(f"{raw.count(chr(0).encode())} בייטי NUL — קובץ פגום")
    try:
        t = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        return fails + [f"UTF-8 לא תקין: {e}"], warns
    clean = strip_noise(t)
    for tag in BLOCK_TAGS:
        o, c = block_balance(clean, tag)
        if o != c:
            fails.append(f"חוסר איזון <{tag}>: {o} נפתחות / {c} נסגרות (קטיעה?)")
    if not t.rstrip().endswith("</html>"):
        warns.append("לא נגמר ב-</html>")
    return fails, warns

def footer_audit(files):
    """בודק שהפוטר של כל דף תוכן יושב ישירות תחת ה-body ולא בלוע באלמנט לא סגור.
    רץ תמיד על כל האתר כדי לתפוס דפים ישנים שנשברו ולא נגעו בהם מאז."""
    problems = []
    for path in sorted(set(all_html())):
        if any(x in path.replace("\\", "/") for x in FOOTER_EXEMPT):
            continue
        try:
            t = open(path, encoding="utf-8").read()
        except Exception:
            continue
        m = re.search(r'<footer\b[^>]*class="[^"]*site-footer', t)
        n = len(re.findall(r'<footer\b[^>]*class="[^"]*site-footer', t))
        if m is None:
            # רק דפים שאמורים לכלול פוטר (כאלה עם ה-marker או תגית footer כלשהי)
            if "<!-- Unified site footer -->" in t or "<footer" in t:
                problems.append((path, "אין <footer class=site-footer> תקין"))
            continue
        if n > 1:
            problems.append((path, f"{n} פוטרים — צריך אחד"))
        head = strip_noise(t[:m.start()])
        opened = []
        for tag in BLOCK_TAGS:
            o, c = block_balance(head, tag)
            if o != c:
                opened.append(f"{tag}:{o-c:+d}")
        if opened:
            problems.append((path, "הפוטר בלוע בתוך אלמנט לא סגור לפניו (" + ", ".join(opened) + ")"))
    return problems

def main(argv):
    args = argv[1:]
    if "--all" in args or not args:
        files = all_html()
    else:
        files = args
    nbad = 0
    for f in files:
        # דפי אזור-לקוחות הם פרגמנטים מכוונים (תוכן מוזרק ב-JS) — בדיקת NUL/UTF8 בלבד
        rel = f.replace("\\","/")
        # שער דף ההרצאה המאוחד — רק על lecture/ בשורש. בלי העיגון הזה הוא נתפס
        # גם על services/hitech-lecture/ וחסם כל פריסה שנגעה בו (תוקן 27.8.26).
        if rel.startswith("lecture/") or "/lecture/" in rel:
            fails = lecture_check(f)
            if fails:
                nbad += 1; print(f"\u274c {f}")
                for e in fails: print(f"     FAIL: {e}")
            else:
                print(f"\u2705 {f}  (דף הרצאה מאוחד — שער ייעודי עבר)")
            continue
        exempt = any(x in rel for x in FOOTER_EXEMPT)
        if exempt:
            raw = open(f,"rb").read() if os.path.exists(f) else b""
            fails = ["בייטי NUL — קובץ פגום"] if b"\x00" in raw else []
            warns = []
            if fails:
                nbad += 1; print(f"❌ {f}")
                for e in fails: print(f"     FAIL: {e}")
            else:
                print(f"✅ {f}  (אזור לקוחות — בדיקת מבנה מדולגת)")
            continue
        fails, warns = check_file(f)
        if fails:
            nbad += 1
            print(f"❌ {f}")
            for e in fails: print(f"     FAIL: {e}")
            for w in warns: print(f"     warn: {w}")
        elif warns:
            print(f"⚠️  {f}  ({'; '.join(warns)})")
        else:
            print(f"✅ {f}")
    # בדיקת פוטר לכל האתר — תמיד
    fp = footer_audit(files)
    if fp:
        print("\n— בדיקת שלמות פוטר (כל האתר) —")
        for path, why in fp:
            print(f"❌ {path}\n     FAIL: {why}")
        nbad += len(fp)
    print()
    if nbad:
        print(f"check-html: {nbad} כשלים — הפריסה נחסמה. תקן ודחוף מחדש.")
        return 1
    print(f"check-html: {len(files)} קבצים נבדקו + אודיט פוטר מלא, ללא שגיאות חוסמות.")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
