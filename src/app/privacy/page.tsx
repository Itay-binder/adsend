import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'מדיניות פרטיות — Adigo',
  description: 'מדיניות פרטיות של Adigo — איך אנו אוספים ושומרים מידע',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-6">
      <div className="max-w-3xl mx-auto" dir="rtl">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">מדיניות פרטיות</h1>
        <p className="text-zinc-500 mb-10">עודכן לאחרונה: יוני 2026</p>

        <section className="space-y-6 leading-relaxed text-lg">
          <p>
            Adigo (להלן: "השירות", "אנחנו") מכבדת את פרטיותך. מסמך זה מסביר אילו פרטים אנו אוספים, איך
            אנו משתמשים בהם, ועם מי הם משותפים. השירות מסופק על ידי איתי בינדר.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">1. אילו פרטים אנו אוספים</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>פרטים שמסרת בעת ההרשמה: שם מלא, כתובת אימייל ומספר טלפון.</li>
            <li>פרטי החיבור לחשבונות חיצוניים: Meta Ads ו-WhatsApp (נשמרים מוצפנים).</li>
            <li>תוכן שאתה מעלה דרך השירות: תמונות, סרטונים וטקסטים שאתה שולח לבוט.</li>
            <li>נתוני שימוש: כניסות, פעולות, אירועי מערכת לצרכי תפעול ושיפור המוצר.</li>
            <li>נתוני תשלום: מטופלים על ידי Cardcom; אנו שומרים רק טוקן ומועד תפוגה, לא פרטי כרטיס.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">2. מטרות השימוש במידע</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>אספקת השירות: העלאת קריאייטיבים, ניהול קמפיינים, תקשורת עם ה-API של Meta.</li>
            <li>תמיכה ושירות לקוחות.</li>
            <li>שיפור המוצר וניתוח שימוש מצרפי (לא מזהה).</li>
            <li>חיוב ותפעול המנוי.</li>
            <li>שליחת עדכוני שירות חשובים באימייל ובוואצפ.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">3. שיתוף מידע עם צדדים שלישיים</h2>
          <p>אנו לא מוכרים את המידע שלך. שיתוף מוגבל לספקי שירות הכרחיים:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Meta Platforms, Inc.</strong> — להעלאת קריאייטיבים וקריאות API לחשבון המודעות שלך.</li>
            <li><strong>Supabase</strong> — אחסון בסיס נתונים.</li>
            <li><strong>Cardcom</strong> — סליקת תשלומים.</li>
            <li><strong>GreenAPI</strong> — שליחת התראות תפעוליות באמצעות WhatsApp.</li>
            <li><strong>Vercel</strong> — אירוח האפליקציה.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">4. אבטחת מידע</h2>
          <p>
            כל הטוקנים והפרטים הרגישים מוצפנים בעת השמירה. התקשורת מאובטחת ב-SSL. אנו מיישמים בקרת
            גישה מבוססת תפקידים ומעבירים פרטי אשראי דרך Cardcom בלבד.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">5. שמירת מידע</h2>
          <p>
            אנו שומרים את המידע שלך כל עוד החשבון שלך פעיל. לאחר ביטול מנוי או בקשת מחיקה — המידע
            ימחק תוך 30 ימים, למעט מידע שאנו חייבים בחוק לשמור (כגון תיעוד חשבוניות).
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">6. הזכויות שלך</h2>
          <p>זכותך:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>לגשת לנתונים שלך.</li>
            <li>לתקן מידע שגוי.</li>
            <li>לבקש מחיקה (ראה{' '}
              <a href="/data-deletion" className="text-emerald-400 underline">דף מחיקת נתונים</a>).
            </li>
            <li>לנתק את החיבור ל-Meta או ל-WhatsApp בכל רגע.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">7. עוגיות (Cookies)</h2>
          <p>
            אנו משתמשים בעוגיות הכרחיות לשמירת ההתחברות ותפעול האתר, וב-Meta Pixel ו-Google Tag Manager
            לצרכי מדידה. אפשר לחסום עוגיות בהגדרות הדפדפן (זה עלול לפגוע בתפקוד).
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">8. שינויים במדיניות</h2>
          <p>
            במידה ונשנה את המדיניות, נעדכן את התאריך בראש הדף. שינויים מהותיים יישלחו גם באימייל.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">9. יצירת קשר</h2>
          <p>
            לכל שאלה בנוגע לפרטיות:{' '}
            <a href="mailto:itay@binder.co.il" className="text-emerald-400 underline">
              itay@binder.co.il
            </a>{' '}
            או בוואצפ:{' '}
            <a href="https://wa.me/972526660006" className="text-emerald-400 underline">
              +972-52-666-0006
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  )
}
