// שער סיסמה לאזור הפרטי /private/ — נאכף בצד השרת.
// התוכן אינו נשלח לדפדפן בלי עוגיית אימות תקפה.
// חל אך ורק על /private/* — שאר האתר אינו מושפע.
const PASSWORD = "פורטלאישיאחיטוב";
const COOKIE_NAME = "priv_auth";
const TOKEN = "f22b8687e7660df119aea8f091dd81d22c677f3904f6964db52b79abdf19a38d";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // חצי שנה

function loginPage(wrong) {
  const msg = wrong ? '<p class="err">סיסמה שגויה — נסה שוב</p>' : "";
  return new Response(`<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>גישה פרטית</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Heebo','Segoe UI',sans-serif;background:#0F1B21;color:#E2E8F0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
  .box{background:#17262E;border:1px solid #2C3F49;border-radius:16px;padding:36px 32px;max-width:380px;width:100%;text-align:center}
  h1{font-size:1.25rem;margin-bottom:6px;color:#F8FAFC}
  p{color:#8FA3AD;font-size:.9rem;margin-bottom:22px}
  .err{color:#F87171;margin-bottom:14px;font-weight:600}
  input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #3B505B;background:#0F1B21;color:#F1F5F9;font-size:1rem;margin-bottom:14px;text-align:center}
  input:focus{outline:2px solid #007DA8;border-color:transparent}
  button{width:100%;padding:12px;border:0;border-radius:10px;background:#007DA8;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}
  button:hover{background:#0093C4}
</style>
</head>
<body>
<div class="box">
  <h1>הפורטל האישי</h1>
  <p>אזור זה מיועד לבעל האתר בלבד</p>
  ${msg}
  <form method="POST" action="/private/login">
    <input type="password" name="password" placeholder="סיסמה" autofocus autocomplete="current-password">
    <button type="submit">כניסה</button>
  </form>
</div>
</body>
</html>`, {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const ba = enc.encode(a), bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const cookies = request.headers.get("Cookie") || "";
  const authed = cookies.split(/;\s*/).some((c) => {
    const eq = c.indexOf("=");
    return eq > 0 && c.slice(0, eq) === COOKIE_NAME && timingSafeEqual(c.slice(eq + 1), TOKEN);
  });

  if (request.method === "POST" && url.pathname === "/private/login") {
    let pw = "";
    try {
      const form = await request.formData();
      pw = String(form.get("password") || "");
    } catch (e) { /* גוף לא תקין */ }
    if (timingSafeEqual(pw, PASSWORD)) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/private/",
          "Set-Cookie": `${COOKIE_NAME}=${TOKEN}; HttpOnly; Secure; Path=/private/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`,
          "Cache-Control": "no-store",
        },
      });
    }
    await new Promise((r) => setTimeout(r, 1500));
    return loginPage(true);
  }

  if (!authed) return loginPage(false);

  if (url.pathname === "/private/logout") {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/private/",
        "Set-Cookie": `${COOKIE_NAME}=deleted; HttpOnly; Secure; Path=/private/; Max-Age=0; SameSite=Lax`,
      },
    });
  }

  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set("Cache-Control", "private, no-store");
  out.headers.set("X-Robots-Tag", "noindex");
  return out;
}
