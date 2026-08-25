// שמירת שיוכי התיקיות של הפורטל האישי.
// מוגן ממילא על ידי _middleware.js שבאותה תיקייה — בלי סיסמה לא מגיעים לכאן.
//
// GET  /private/api  → מחזיר את מה ששמור
// POST /private/api  → שומר (גוף JSON)
//
// מבנה הנתונים:
//   { assign: { "<מזהה פריט>": "<שם תיקייה>" },
//     extra:  [ { i, n, u, fo } ],        ← דפים מהאתר שאיתן הוסיף
//     order:  [ "שם תיקייה", ... ] }      ← סדר התיקיות

const KEY = "portal";
const EMPTY = { assign: {}, extra: [], order: [] };

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });

export async function onRequest(context) {
  const { request, env } = context;

  if (!env.PORTAL) {
    return json({ error: "no-store", message: "האחסון אינו מחובר לפרויקט" }, 503);
  }

  if (request.method === "GET") {
    const raw = await env.PORTAL.get(KEY);
    return json(raw ? JSON.parse(raw) : EMPTY);
  }

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); }
    catch (e) { return json({ error: "bad-json" }, 400); }

    // ולידציה — לא סומכים על מה שמגיע
    const out = { assign: {}, extra: [], order: [] };
    const s = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

    if (body && typeof body.assign === "object" && body.assign) {
      for (const [k, v] of Object.entries(body.assign)) {
        const key = s(k, 80), val = s(v, 60);
        if (key) out.assign[key] = val;          // ערך ריק = בלי תיקייה
      }
    }
    if (Array.isArray(body?.extra)) {
      for (const it of body.extra.slice(0, 200)) {
        const u = s(it?.u, 500);
        if (!/^https?:\/\//i.test(u)) continue;   // רק כתובות אמיתיות
        const n = s(it?.n, 120);
        if (!n) continue;
        out.extra.push({ i: s(it?.i, 80) || ("u" + out.extra.length), n, u, fo: s(it?.fo, 60) });
      }
    }
    if (Array.isArray(body?.order)) {
      out.order = body.order.map((x) => s(x, 60)).filter(Boolean).slice(0, 60);
    }

    await env.PORTAL.put(KEY, JSON.stringify(out));
    return json({ ok: true, saved: out });
  }

  return json({ error: "method" }, 405);
}
