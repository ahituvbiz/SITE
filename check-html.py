#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
check-html.py — בדיקת תקינות קבצי HTML לפני פריסה ל-pensya.info.
נועד למנוע דחיפה של קבצים פגומים/קטועים (באג ה-mount, ראה CONTEXT v4.8/v5.5).

שימוש:
    python3 check-html.py file1.html file2.html ...   # בודק קבצים מסוימים (מומלץ: רק מה שמשתנה)
    python3 check-html.py --all                        # אודיט מלא של כל קבצי ה-HTML בריפו

בדיקות (FAIL = חוסם):
  1. אפס בייטי NUL (\\x00)          — חתימה מובהקת של קובץ פגום
  2. UTF-8 תקין                     — אין בייטים שבורים
  3. איזון תגיות בלוק                — div / section / article / details
     (אחרי הסרת <script>, <style> והערות, כדי לא לספור תגיות בתוך JS/CSS)

בדיקה (WARN = לא חוסם):
  4. הקובץ אינו נגמר ב-</html>       — חלק מהדפים נגמרים ב-</footer> בכוונה (קונבנציה)

יציאה: 0 אם אין FAIL, 1 אם קובץ כלשהו נכשל.
"""
import sys, os, re, subprocess

BLOCK_TAGS = ["div", "section", "article", "details"]

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
        o = len(re.findall(r"<" + tag + r"[\s>]", clean, re.I))
        c = len(re.findall(r"</" + tag + r">", clean, re.I))
        if o != c:
            fails.append(f"חוסר איזון <{tag}>: {o} נפתחות / {c} נסגרות (קטיעה?)")
    if not t.rstrip().endswith("</html>"):
        warns.append("לא נגמר ב-</html>")
    return fails, warns

def main(argv):
    args = argv[1:]
    if "--all" in args or not args:
        files = all_html()
    else:
        files = args
    nbad = 0
    for f in files:
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
    print()
    if nbad:
        print(f"check-html: {nbad} קבצים נכשלו — הפריסה נחסמה. תקן ודחוף מחדש.")
        return 1
    print(f"check-html: {len(files)} קבצים נבדקו, ללא שגיאות חוסמות.")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv))
