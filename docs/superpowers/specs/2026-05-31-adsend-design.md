# AdSend — מסמך ספק (Design Spec)

**תאריך:** 2026-05-31  
**מוצר:** AdSend — Micro SaaS להעלאת קריאייטיבים למטא דרך ווצאפ  
**סטטוס:** מאושר לבנייה

---

## 1. חזון המוצר

AdSend מאפשר לקמפיינרים להעלות קריאייטיבים לחשבון המודעות שלהם ב-Meta ישירות דרך ווצאפ — תוך 30 שניות, מהנייד, בלי לפתוח Ads Manager.

**הבעיה שהוא פותר:** קריאייטיבים רבים לא מגיעים לטסט כי תהליך ההעלאה ל-Ads Manager הוא מסורבל, דורש מחשב, ולוקח זמן. AdSend מוריד את חסם הכניסה לאפס.

**מה הוא לא:** לא מחליף Ads Manager. לא בונה קמפיינים מאפס. כמו שבוסט לא מחליף מנהל מודעות — AdSend הוא כלי טסטים מהיר ונגיש.

**תמחור:** 99₪/חודש, 7 ימי ניסיון חינם.

---

## 2. החלטות ארכיטקטורה

| נושא | החלטה | סיבה |
|---|---|---|
| WhatsApp | Baileys per-user | כל לקוח סורק QR משלו — הפרדה מלאה, אין אחריות על המוצר, חינמי |
| Meta Auth | OAuth ("התחבר עם פייסבוק") | פשוט לכל קמפיינר, עד 2000 משתמשים ללא Business Verification |
| AI Agent | Claude Haiku per-message | מבין טקסט חופשי בעברית, עלות ~$0.001 לאינטרקציה |
| Infrastructure | VPS אחד (Hetzner/DigitalOcean) | Baileys + Next.js + API על שרת אחד, ~$20-40/חודש ל-MVP |
| DB/Auth | Supabase | auth מובנה, PostgreSQL, מוכר מפרויקטים קודמים |
| Frontend | Next.js 14+ App Router + TypeScript + Tailwind + shadcn/ui | סטאק קיים ומוכר |

---

## 3. פלואו המשתמש המלא

### אונבורדינג (פעם אחת)
1. לקוח נכנס ל-adsend.co (או בינדר.קו.איל) עם Google/Facebook
2. מסך "חבר ווצאפ" → סורק QR → session נשמר
3. מסך "חבר Meta" → OAuth → בוחר חשבון/ות מודעות → token נשמר
4. מגיע ל-Dashboard — מוכן לשימוש

### העלאת קריאייטיב (שגרה)
```
לקוח שולח מווצאפ שלו → Baileys מקבל → Backend מעבד →
Claude Haiku מפרש → Meta API מעלה → Bot מאשר
```

**פלואו שיחה מפורט:**
1. לקוח שולח תמונה/וידאו (עם כיתוב אופציונלי)
2. Claude Haiku מנתח: קמפיין, סדרה, primary text, headline, UTM, CTA, URL, status
3. Bot שולח אישור עם הפרמטרים שהבין
4. לקוח מאשר (כן/לא/מתקן)
5. Meta API: יצירת ad creative → יצירת ad → סטטוס PAUSED/ACTIVE
6. Bot שולח אישור + קישור ישיר ל-Ads Manager

**כשחסר מידע:** Claude שואל שאלה אחת ממוקדת (לא רשימה). לדוגמה: "לאיזה קמפיין? הפעילים שלך: 1. Retargeting Q2, 2. Prospecting Cold"

---

## 4. מסכים (6 עיקריים)

### מסך 1: Login
- רקע כהה (premium feel)
- לוגו AdSend
- Tagline: "העלה קריאייטיבים וטסטים למנהל מודעות במטא דרך ווצאפ תוך 30 שניות"
- כפתור "המשך עם Google" + "המשך עם Facebook"
- אחרי login ראשון → אונבורדינג (חיבור WA → חיבור Meta)

### מסך 2: Dashboard ראשי
- ברכה + שם המשתמש
- סטטוס chips: ✅ ווצאפ מחובר / ⚠️ Meta לא מחובר
- סטטיסטיקות: העלאות השבוע, מספר חשבונות מחוברים
- כפתור "שלח קריאייטיב עכשיו" (פותח הוראות ווצאפ)
- ניווט: Dashboard / הגדרות / אקדמיה / נציג

### מסך 3: חיבור WhatsApp
- 3 שלבים עם מספרים: פתח ווצאפ → כלים → סרוק QR
- QR Code דינמי (מתחלף כל 20 שניות)
- סטטוס: ממתין / מחובר / נותק (כולל כפתור "חבר מחדש")

### מסך 4: חיבור Meta Ads
- כפתור OAuth גדול "התחבר עם Facebook"
- אחרי חיבור: רשימת חשבונות מודעות עם toggle לכל אחד
- badge "פעיל" / "מושהה" לכל חשבון
- אפשרות להוסיף חשבון נוסף

### מסך 5: פלואו ווצאפ (הלב של המוצר)
- אין מסך ב-app עבור זה — קורה כולו בווצאפ
- בדשבורד: כפתור "העתק מספר הבוט" + הוראות קצרות

### מסך 6: אקדמיה + FAQ
- מדריכי וידאו קצרים: "התחלה מהירה", "פקודות הבוט", "טיפים לטסטים"
- שאלות נפוצות (accordion)
- כפתור "פנה לנציג" → פותח ווצאפ עם הודעה מוכנה

---

## 5. מודל הנתונים (Supabase)

```
users
  id, email, name, created_at, plan, trial_ends_at

whatsapp_sessions
  id, user_id, phone_number, session_data (encrypted), status, last_seen

meta_connections
  id, user_id, access_token (encrypted), token_expires_at, ad_accounts[]

ad_accounts
  id, user_id, account_id, account_name, status

uploads
  id, user_id, ad_account_id, campaign_id, adset_id, ad_id,
  media_type, primary_text, headline, cta, url, utm,
  status, created_at, meta_ad_id
```

---

## 6. ארכיטקטורה טכנית

```
[ווצאפ לקוח]
     ↓ Baileys WebSocket
[Node.js Backend — /api/whatsapp/webhook]
     ↓
[Claude Haiku — מפרש הודעה + מחלץ פרמטרים]
     ↓
[Meta Marketing API — יצירת Creative + Ad]
     ↓
[Baileys — שולח אישור בחזרה]
     ↓
[Supabase — שומר upload record]
```

**שרתים:**
- Frontend: Vercel (Next.js)
- Backend + Baileys sessions: VPS (Hetzner CX21 — $6/חודש ל-MVP)
- DB: Supabase (free tier ל-MVP)

---

## 7. טק סטאק מלא

| שכבה | טכנולוגיה |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Backend API | Next.js API Routes / Node.js Express |
| WhatsApp | Baileys (open source) |
| AI Agent | Anthropic Claude Haiku API |
| Meta | Meta Marketing API v20+ |
| Auth | Supabase Auth (Google + Facebook OAuth) |
| DB | Supabase PostgreSQL |
| Hosting | Vercel (frontend) + Hetzner VPS (Baileys sessions) |
| Payments | Stripe (99₪/חודש) |

---

## 8. סדר בנייה (MVP)

1. **Bootstrap** — Next.js + Supabase + auth
2. **חיבור Meta** — OAuth flow, שמירת token, רשימת חשבונות
3. **Baileys session manager** — QR generation, session save/restore, VPS
4. **WhatsApp webhook** — קבלת הודעה → Claude → Meta API → תגובה
5. **Dashboard** — status chips, upload history
6. **Onboarding flow** — WA → Meta → Dashboard
7. **Academy + FAQ** — static content
8. **Stripe** — checkout, trial, webhooks

---

## 9. מה לא ב-MVP

- יצירת קמפיין חדש מהווצאפ — רק הוספה לקיים
- ניתוח ביצועים / reporting
- Multi-user per account (סוכנויות)
- Baileys per-user premium tier (ב-MVP הכל Baileys)
- אפליקציית מובייל native
