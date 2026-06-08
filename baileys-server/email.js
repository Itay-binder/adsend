// Tiny Resend wrapper — send a transactional email. Falls back silently
// when RESEND_API_KEY isn't configured so dev/local doesn't fail.
export async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY missing — skipping send')
    return { ok: false, reason: 'no_api_key' }
  }
  const from = process.env.FROM_EMAIL ?? 'Adigo <itay@binder.co.il>'
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('[email] resend error:', data)
      return { ok: false, error: data.message ?? `HTTP ${res.status}` }
    }
    return { ok: true, id: data.id }
  } catch (e) {
    console.error('[email] fetch failed:', e.message)
    return { ok: false, error: e.message }
  }
}

export function buildDisconnectEmail(userName) {
  const greeting = userName ? `היי ${userName.split(' ')[0]},` : 'היי,'
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
    <div style="font-weight:900;font-size:24px;margin-bottom:24px">
      Adi<span style="color:#38bdf8">go</span>
    </div>
    <p style="font-size:16px;line-height:1.6;margin:0 0 12px">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 20px">
      החיבור לווצאפ שלך ב-Adigo נותק לפני כמה רגעים.
      כל קריאייטיב שתשלח לבוט עכשיו לא יעבור ל-Meta Ads עד שתחבר מחדש.
    </p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;font-weight:600">
      חיבור מחדש לוקח פחות מ-30 שניות:
    </p>
    <ol style="font-size:16px;line-height:1.8;margin:0 0 24px;padding-right:20px">
      <li>כנס ל-<a href="https://adsend.vercel.app/connect/whatsapp" style="color:#10b981">adsend.vercel.app/connect/whatsapp</a></li>
      <li>סרוק את ה-QR עם האפליקציה של ווצאפ</li>
      <li>סיימת — הבוט חוזר לעבוד מיד</li>
    </ol>
    <div style="margin:24px 0">
      <a href="https://adsend.vercel.app/connect/whatsapp"
         style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:8px">
        חבר ווצאפ עכשיו
      </a>
    </div>
    <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6b7280">
      אם זה ממשיך לקרות או שמשהו לא ברור — תענה למייל הזה ואני אעזור.
    </p>
    <p style="font-size:14px;line-height:1.6;margin:8px 0 0;color:#6b7280">
      איתי · Adigo
    </p>
  </div>
</body>
</html>`
  const text = `${greeting}

החיבור לווצאפ שלך ב-Adigo נותק לפני כמה רגעים.
כל קריאייטיב שתשלח לבוט עכשיו לא יעבור ל-Meta Ads עד שתחבר מחדש.

חיבור מחדש לוקח פחות מ-30 שניות:
1. כנס ל-https://adsend.vercel.app/connect/whatsapp
2. סרוק את ה-QR עם האפליקציה של ווצאפ
3. סיימת — הבוט חוזר לעבוד מיד

אם זה ממשיך לקרות או שמשהו לא ברור — תענה למייל הזה ואני אעזור.

איתי · Adigo`
  return { subject: 'החיבור לווצאפ של Adigo נותק', html, text }
}
