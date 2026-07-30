#!/usr/bin/env python3
"""בדיקת שלמות ל-HTML: מזהה שחיתות סנכרון (NUL, UTF-8 שבור, סקריפט לא סגור, סוף חתוך).
שימוש: python3 check-integrity.py <path-or-dir> [--quiet]
יציאה 0 = הכל תקין, 1 = נמצאו קבצים פגומים. """
import sys,os,re,glob
def check(path):
    b=open(path,"rb").read()
    iss=[]
    if b.count(0): iss.append("NUL(%d)"%b.count(0))
    dec=b.decode("utf-8","replace")
    try: b.decode("utf-8")
    except UnicodeDecodeError as e: iss.append("badUTF8@%d"%e.start)
    if "�" in dec and not any("badUTF8" in i for i in iss): iss.append("replChar")
    inline=len(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>',dec))
    src=len(re.findall(r'<script[^>]*\bsrc=',dec))
    close=dec.count("</script>")
    if inline+src!=close: iss.append("scriptUnbalanced(open=%d,close=%d)"%(inline+src,close))
    if re.search(r'document\.b(?![a-zA-Z])',dec): iss.append("hamburger-cut")
    tail=b.rstrip(b"\x00\r\n \t")
    # מוקאפים ("תוכן בלבד") מסתיימים בסמן ה-chrome ולא בתגית סגירה - זה תקין
    ok_ends=(b"</html>",b"</footer>",b"</body>",b"<!--@CHROME:FOOTER@-->")
    is_fragment = "<html" not in dec[:2000].lower()   # שברי תוכן (portal) - אין להם תגית סוגרת
    if not is_fragment and not tail.endswith(ok_ends):
        iss.append("badEnd:"+tail[-14:].decode("utf-8","replace"))
    # חתך באמצע תגית: תגית שנפתחת ולא נסגרת, והשורה הבאה אינה המשך תקין של מאפיינים
    lines=dec.split("\n")
    for i,l in enumerate(lines):
        st=l.strip()
        if not re.match(r'^<[a-zA-Z][^>]*$',st) or st.startswith('<!--'): continue
        nxt=lines[i+1].strip() if i+1<len(lines) else ''
        # המשך לגיטימי: מאפיין נוסף, סגירת תגית, או ערך מאפיין שנמשך
        if nxt and not nxt.startswith('<') and re.match(r'^[a-zA-Z-]+\s*=|^/?>|^[\"\']',nxt): continue
        iss.append("cutTag@%d:%s"%(i+1,st[:40])); break
    return iss
def main():
    args=[a for a in sys.argv[1:] if not a.startswith("--")]
    quiet="--quiet" in sys.argv
    target=args[0] if args else "."
    files=[target] if os.path.isfile(target) else sorted(glob.glob(os.path.join(target,"**","*.html"),recursive=True))
    bad=0
    for f in files:
        iss=check(f)
        if iss: bad+=1; print("CORRUPT %s  %s"%(f,iss))
        elif not quiet: pass
    print("--- scanned %d files, %d corrupt ---"%(len(files),bad))
    sys.exit(1 if bad else 0)
if __name__=="__main__": main()
