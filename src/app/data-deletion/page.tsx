'use client'

import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'

const T = {
  en: {
    title: 'Data deletion',
    updated: 'Last updated: July 2026',
    intro: 'At Adigo we respect your right to delete all your data from the system at any time.',
    what_h: 'What gets deleted',
    what_1: 'Your account details (email, name, phone)',
    what_2: 'Meta and WhatsApp connections',
    what_3: 'Upload history and creatives',
    what_4: 'Usage events and logs',
    how_h: 'How to request deletion',
    how_email_1: 'Email',
    how_email_2: 'with the subject:',
    how_email_3: '"Data deletion request"',
    how_wa: 'Or ping us on WhatsApp:',
    how_include: 'Please include the email address you signed up with so we can identify your account.',
    time_h: 'Timeline',
    time_a: 'Deletion completes within',
    time_b: '30 days',
    time_c: 'of receiving the request. You’ll get an email confirmation once it’s done.',
    meta_h: 'Removing Meta connection yourself',
    meta_text_1: 'To disconnect Adigo from your Facebook account on your own:',
    meta_link_text: 'Facebook Settings → Business Integrations',
    meta_text_2: '→ Adigo → Remove.',
  },
  he: {
    title: 'מחיקת נתונים',
    updated: 'עודכן לאחרונה: יולי 2026',
    intro: 'ב-Adigo אנו מכבדים את הזכות שלך למחוק את כל הנתונים שלך מהמערכת בכל עת.',
    what_h: 'מה נמחק',
    what_1: 'פרטי החשבון שלך (אימייל, שם, טלפון)',
    what_2: 'חיבור Meta ו-WhatsApp',
    what_3: 'היסטוריית העלאות וקריאייטיבים',
    what_4: 'אירועי שימוש ולוגים',
    how_h: 'איך לבקש מחיקה',
    how_email_1: 'שלח אימייל לכתובת',
    how_email_2: 'עם הנושא:',
    how_email_3: '"בקשת מחיקת נתונים"',
    how_wa: 'או שלח הודעת וואצפ ל-',
    how_include: 'בבקשה ציין את כתובת האימייל שאיתה נרשמת ל-Adigo כדי שנוכל לזהות את החשבון.',
    time_h: 'תוך כמה זמן',
    time_a: 'המחיקה תבוצע תוך',
    time_b: '30 ימים',
    time_c: 'ממועד קבלת הבקשה. תקבל אישור באימייל לאחר השלמת המחיקה.',
    meta_h: 'הסרת חיבור Meta בעצמך',
    meta_text_1: 'להסרת החיבור של Adigo מחשבון Facebook שלך באופן עצמאי:',
    meta_link_text: 'Facebook Settings → Business Integrations',
    meta_text_2: '→ Adigo → Remove.',
  },
} as const

export default function DataDeletionPage() {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-6">
      <div className="max-w-3xl mx-auto" dir={dir}>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-8">{t.title}</h1>

        <p className="text-lg leading-relaxed mb-6">
          {t.intro}
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">{t.what_h}</h2>
        <ul className="space-y-2 list-disc list-inside mb-6">
          <li>{t.what_1}</li>
          <li>{t.what_2}</li>
          <li>{t.what_3}</li>
          <li>{t.what_4}</li>
        </ul>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">{t.how_h}</h2>
        <p className="text-lg leading-relaxed mb-4">
          {t.how_email_1}{' '}
          <a href="mailto:itay@binder.co.il" className="text-emerald-400 underline">
            itay@binder.co.il
          </a>{' '}
          {t.how_email_2} <strong>{t.how_email_3}</strong>
        </p>
        <p className="text-lg leading-relaxed mb-4">
          {t.how_wa}{' '}
          <a href="https://wa.me/972526660006" className="text-emerald-400 underline">
            +972-52-666-0006
          </a>
        </p>
        <p className="text-lg leading-relaxed mb-6">
          {t.how_include}
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">{t.time_h}</h2>
        <p className="text-lg leading-relaxed mb-6">
          {t.time_a} <strong>{t.time_b}</strong> {t.time_c}
        </p>

        <h2 className="text-2xl font-bold text-white mt-10 mb-4">{t.meta_h}</h2>
        <p className="text-lg leading-relaxed mb-6">
          {t.meta_text_1}{' '}
          <a
            href="https://www.facebook.com/settings?tab=business_tools"
            className="text-emerald-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            {t.meta_link_text}
          </a>{' '}
          {t.meta_text_2}
        </p>

        <p className="text-sm text-zinc-500 mt-12 border-t border-zinc-800 pt-6">
          {t.updated}
        </p>
      </div>
    </main>
  )
}
