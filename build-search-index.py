#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-search-index.py — מייצר את אינדקס החיפוש של pensya.info מתוך הדפים עצמם.

למה זה קיים: עד 26.8.26 האינדקס היה רשימה ידנית בתוך search.js, והוא פיגר אחרי
האתר — 17 דפים חיים פשוט לא היו בו, ולכן חיפוש "מורים" החזיר "לא נמצאו תוצאות".
הסקריפט הזה גוזר את האינדקס מהתוכן החי, ולכן דריפט הוא בלתי אפשרי מבנית.

שימוש:
    python3 build-search-index.py <ריפו>            # כותב search-index.json
    python3 build-search-index.py <ריפו> --check    # מוודא שהקובץ הקיים מעודכן (יציאה 1 אם לא)

רץ אוטומטית מ-auto-deploy.ps1 בכל פריסה. אין מה להריץ ידנית.
"""
import os, re, sys, json, html, math, collections

# אזורים שלא נכנסים לחיפוש הציבורי
SKIP_DIRS = {'.git', 'clients', 'proof', 'game', 'private', 'lecture',
             'design-assets', 'node_modules'}
# משקלי שדות
W_TITLE, W_DESC, W_HEAD, W_BODY = 12, 6, 4, 1
TF_CAP = 99

FINALS = str.maketrans('ךםןףץ', 'כמנפצ')
STOP = set('''של את על עם לא זה זו הוא היא הם הן אני אתה אנחנו מה מי יש אין אם כי גם
כל או אבל אז רק עוד כבר אחרי לפני בין תחת אצל כמו כדי מאוד יותר פחות אשר היה היו להיות
כן ולא וגם אך שלא שהוא בו בה בהם אותו אותה זאת אלה כאן שם עכשיו איך למה מתי כמה'''.split())


def stem(w):
    """גִזעוּן עברי גס: סיומות ריבוי/נקבה, אותיות סופיות, אותיות שימוש.
    סדר הפעולות קריטי: קילוף הסיומת לפני נרמול האות הסופית, אחרת "מורים"
    הופך ל-"מורימ" והסיומת "ים" כבר לא מזוהה (באג שתוקן 27.8.26).
    חובה שיהיה זהה בית-בבית ל-stem() שב-search.js."""
    if len(w) >= 4:
        w = re.sub(r'(ויות|יות|ים|ות|יה|ה|ת|י)$', '', w)
    w = w.translate(FINALS)
    g = 0
    while len(w) >= 5 and w[0] in 'והבכלמש' and g < 2:
        w = w[1:]
        g += 1
    return w


def norm_words(s):
    s = re.sub(r'[֑-ׇ]', '', s)
    s = re.sub(r'[״”“"\'’‘׳]', '', s)
    s = re.sub(r'[^0-9A-Za-z֐-׿&%]+', ' ', s)
    return [w for w in s.lower().split() if len(w) >= 2 and w not in STOP]


def strip_html(h):
    h = re.sub(r'<(script|style|nav|footer|svg|noscript)\b.*?</\1>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<header\b.*?</header>', ' ', h, flags=re.S | re.I)
    h = re.sub(r'<!--.*?-->', ' ', h, flags=re.S)
    h = re.sub(r'<[^>]+>', ' ', h)
    return html.unescape(h)


def clean(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()


def collect(repo):
    pages, problems = [], []
    for root, dirs, files in os.walk(repo):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        if 'index.html' not in files:
            continue
        path = os.path.join(root, 'index.html')
        raw = open(path, encoding='utf-8', errors='replace').read()
        if re.search(r'name=["\']robots["\'][^>]*noindex', raw, re.I):
            continue
        rel = os.path.relpath(root, repo).replace('\\', '/')
        url = '/' if rel == '.' else '/' + rel + '/'
        m = re.search(r'<title>(.*?)</title>', raw, re.S)
        title = clean(m.group(1)).split('|')[0].strip(' -–—') if m else ''
        m = re.search(r'name=["\']description["\'][^>]*content=["\'](.*?)["\']', raw, re.S)
        desc = clean(m.group(1)) if m else ''
        heads = [clean(x) for x in re.findall(r'<h[23][^>]*>(.*?)</h[23]>', raw, re.S)]
        heads = [h for h in heads if 3 <= len(h) <= 90][:14]
        h1 = ' '.join(clean(x) for x in re.findall(r'<h1[^>]*>(.*?)</h1>', raw, re.S))
        body = strip_html(raw)
        if not title:
            problems.append(url + ' — אין <title>')
            continue
        if not desc:
            problems.append(url + ' — אין meta description')
        pages.append({'t': title, 'u': url, 'd': desc[:180], 'h': heads,
                      '_h1': h1, '_body': body})
    pages.sort(key=lambda p: p['u'])
    return pages, problems


def build(repo):
    pages, problems = collect(repo)
    if len(pages) < 20:
        print('שגיאה: נמצאו רק %d דפים — משהו שבור בסריקה' % len(pages))
        sys.exit(2)
    postings = collections.defaultdict(dict)
    for i, p in enumerate(pages):
        fields = ((p['t'], W_TITLE), (p['_h1'], W_TITLE), (p['d'], W_DESC),
                  (' '.join(p['h']), W_HEAD), (p['_body'], W_BODY))
        for text, w in fields:
            for word in norm_words(text):
                s = stem(word)
                if len(s) < 2:
                    continue
                postings[s][i] = min(postings[s].get(i, 0) + w, TF_CAP)
    n = len(pages)
    idx = {}
    for term, per in postings.items():
        df = len(per)
        idf = round(math.log(1 + n / df), 2)
        idx[term] = [idf, [[pi, w] for pi, w in sorted(per.items())]]
    out = {'v': 3, 'n': n,
           'p': [{'t': p['t'], 'u': p['u'], 'd': p['d'], 'h': p['h']} for p in pages],
           'i': idx}
    return out, problems


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    repo = sys.argv[1]
    check = '--check' in sys.argv
    out, problems = build(repo)
    js = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
    dest = os.path.join(repo, 'search-index.json')
    if check:
        old = open(dest, encoding='utf-8').read() if os.path.exists(dest) else ''
        if old != js:
            print('אינדקס החיפוש אינו מעודכן — הרץ build-search-index.py')
            sys.exit(1)
        print('אינדקס החיפוש מעודכן (%d דפים)' % out['n'])
        return
    open(dest, 'w', encoding='utf-8', newline='\n').write(js)
    print('search-index.json נכתב: %d דפים, %d מונחים, %d KB'
          % (out['n'], len(out['i']), round(len(js.encode()) / 1024)))
    for p in problems:
        print('  אזהרה:', p)


main()
