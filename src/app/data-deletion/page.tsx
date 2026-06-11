import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'מחיקת נתונים — Adigo',
  description: 'הוראות למחיקת נתונים אישיים מ-Adigo',
}

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-6">
      <div className="max-w-3xl mx-auto" dir="rtl">
        <h1 className="text-3xl md:text-4xl font-black text-white mb-8">מחיקת נתונים</h1>

        <p className="text-lg leading-relaxed mb-6">
          ב-Adigo אנו מכבדים את הזכות שלך למחוק את כל הנתונים שלך מהמערכת בכל עת.
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">מה נמחק</h2>
        <ul className="space-y-2 list-disc list-inside mb-6">
          <li>פרטי החשבון שלך (אימייל, שם, טלפון)</li>
          <li>חיבור Meta ו-WhatsApp</li>
          <li>היסטוריית העלאות וקריאייטיבים</li>
          <li>אירועי שימוש ולוגים</li>
        </ul>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">איך לבקש מחיקה</h2>
        <p className="text-lg leading-relaxed mb-4">
          שלח אימייל לכתובת{' '}
          <a href="mailto:itay@binder.co.il" className="text-emerald-400 underline">
            itay@binder.co.il
          </a>{' '}
          עם הנושא: <strong>"בקשת מחיקת נתונים"</strong>
        </p>
        <p className="text-lg leading-relaxed mb-4">
          או שלח הודעת וואצפ ל-{' '}
          <a href="https://wa.me/972526660006" className="text-emerald-400 underline">
            +972-52-666-0006
          </a>
        </p>
        <p className="text-lg leading-relaxed mb-6">
          בבקשה ציין את כתובת האימייל שאיתה נרשמת ל-Adigo כדי שנוכל לזהות את החשבון.
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">תוך כמה זמן</h2>
        <p className="text-lg leading-relaxed mb-6">
          המחיקה תבוצע תוך <strong>30 ימים</strong> ממועד קבלת הבקשה. תקבל אישור באימייל לאחר השלמת המחיקה.
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">הסרת חיבור Meta</h2>
        <p className="text-lg leading-relaxed mb-6">
          להסרת החיבור של Adigo מחשבון Facebook שלך באופן עצמאי:{' '}
          <a
            href="https://www.facebook.com/settings?tab=business_tools"
            className="text-emerald-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            Facebook Settings → Business Integrations
          </a>{' '}
          → Adigo → Remove.
        </p>

        <p className="text-sm text-zinc-500 mt-12 border-t border-zinc-800 pt-6">
          עודכן לאחרונה: יוני 2026
        </p>
      </div>
    </main>
  )
}
