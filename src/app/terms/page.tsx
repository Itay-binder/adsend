import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'תנאי שימוש — Adigo',
  description: 'תנאי שימוש בשירות Adigo',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-6">
      <div className="max-w-3xl mx-auto" dir="rtl">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">תנאי שימוש</h1>
        <p className="text-zinc-500 mb-10">עודכן לאחרונה: יוני 2026</p>

        <section className="space-y-6 leading-relaxed text-lg">
          <p>
            ברוכים הבאים ל-Adigo. השימוש בשירות כפוף לתנאים שלהלן. כניסה לשירות והרשמה מהווים את הסכמתך
            המלאה לתנאים אלה. אם אינך מסכים — אנא הימנע משימוש בשירות.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">1. מהות השירות</h2>
          <p>
            Adigo מאפשרת קמפיינרים ומשתמשי Meta Ads להעלות קריאייטיבים לחשבון המודעות שלהם באמצעות
            הודעות WhatsApp. השירות מתחבר ל-API של Meta דרך OAuth ולחשבון WhatsApp שלך דרך חיבור אישי.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">2. רישום ומנוי</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>הרשמה דורשת חשבון Google תקין ומספר טלפון.</li>
            <li>ניסיון חינם בן 7 ימים. בסיום הניסיון מתחיל חיוב חודשי של ₪99 (אלא אם בוטל מראש).</li>
            <li>ביטול אפשרי בכל רגע מתוך ההגדרות או בפנייה ישירה — ללא קנס.</li>
            <li>החיובים החודשיים אינם מוחזרים בגין ימים בלתי מנוצלים, אלא אם נקבע אחרת על ידינו.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">3. אחריות המשתמש</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>אתה אחראי לתוכן הקריאייטיבים שאתה מעלה — לעמידתם במדיניות Meta ובחוק.</li>
            <li>אסור להשתמש בשירות לקידום תוכן אסור, פוגעני, מפר זכויות יוצרים או מטעה.</li>
            <li>אתה מצהיר שיש לך זכות לפרסם את החומרים שאתה מעלה.</li>
            <li>חיוב חשבון המודעות שלך נשלט מצידך — Adigo לא משלם עבור התקציבים שלך.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">4. הגבלת אחריות</h2>
          <p>
            השירות מסופק "כמו שהוא" (As Is). אנו נעשה כל מאמץ סביר להבטיח זמינות, נכונות ותפקוד תקין —
            אך לא נישא באחריות לנזק עקיף, אובדן רווחים, או תקלות הנובעות משירותי צד שלישי
            (כגון Meta, WhatsApp, Cardcom).
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">5. קניין רוחני</h2>
          <p>
            כל הזכויות בקוד, בעיצוב, בטכנולוגיה ובמותג Adigo שייכות לאיתי בינדר. הקריאייטיבים שאתה
            מעלה נשארים בבעלותך המלאה. אתה מעניק לנו רישיון מוגבל לעבד אותם לצורך אספקת השירות בלבד.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">6. הפסקת שירות</h2>
          <p>
            אנו רשאים להשעות או לסיים חשבון אם נתגלה שימוש לרעה, הפרת מדיניות Meta, או חוב בתשלום. במקרה
            כזה תקבל הודעה ויינתן זמן סביר לפעול. במקרים חריגים (אבטחה, הפרת חוק) — הפסקה מיידית.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">7. שינויים בתנאים</h2>
          <p>
            אנו רשאים לעדכן את התנאים מעת לעת. שינויים מהותיים יישלחו בהודעה באימייל. המשך שימוש לאחר
            עדכון מהווה הסכמה לתנאים החדשים.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">8. דין שיפוט</h2>
          <p>
            התנאים כפופים לדיני מדינת ישראל. סמכות שיפוט בלעדית לבתי המשפט המוסמכים במחוז תל אביב.
          </p>

          <h2 className="text-2xl font-bold text-white pt-6">9. יצירת קשר</h2>
          <p>
            לכל שאלה בנוגע לתנאים:{' '}
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
