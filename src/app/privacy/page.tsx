'use client'

import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'

const T = {
  en: {
    title: 'Privacy policy',
    updated: 'Last updated: July 2026',
    intro: 'Adigo ("the Service", "we") respects your privacy. This document explains what data we collect, how we use it, and who we share it with. The Service is operated by Itay Binder.',
    s1_h: '1. Data we collect',
    s1_1: 'Data you provide at signup: full name, email address, and phone number.',
    s1_2: 'External connection tokens: Meta Ads and WhatsApp (stored encrypted).',
    s1_3: 'Content you upload through the Service: images, videos, and text you send to the bot.',
    s1_4: 'Usage data: logins, actions, and system events used for operations and product improvement.',
    s1_5: 'Payment data: handled by Cardcom; we store only a token and expiration date, not full card details.',
    s2_h: '2. How we use the data',
    s2_1: 'Delivering the Service: uploading creatives, managing campaigns, and communicating with Meta’s API.',
    s2_2: 'Customer support and troubleshooting.',
    s2_3: 'Aggregate (non-identifying) product analytics and improvement.',
    s2_4: 'Billing and subscription management.',
    s2_5: 'Sending important service updates via email and WhatsApp.',
    s3_h: '3. Sharing with third parties',
    s3_intro: 'We do not sell your data. Sharing is limited to essential service providers:',
    s3_1: 'Meta Platforms, Inc.',
    s3_1_desc: '— for uploading creatives and calls to your ad account API.',
    s3_2: 'Supabase',
    s3_2_desc: '— database storage.',
    s3_3: 'Cardcom',
    s3_3_desc: '— payment processing.',
    s3_4: 'GreenAPI',
    s3_4_desc: '— operational WhatsApp notifications.',
    s3_5: 'Vercel',
    s3_5_desc: '— application hosting.',
    s4_h: '4. Data security',
    s4_p: 'All tokens and sensitive data are encrypted at rest. Communication is SSL-secured. We use role-based access control and route card details through Cardcom exclusively.',
    s5_h: '5. Data retention',
    s5_p: 'We retain your data as long as your account is active. After cancellation or a deletion request the data is deleted within 30 days, except data we are legally required to retain (invoices, etc.).',
    s6_h: '6. Your rights',
    s6_intro: 'You have the right to:',
    s6_1: 'Access your data.',
    s6_2: 'Correct inaccurate data.',
    s6_3: 'Request deletion (see',
    s6_3_link: 'data deletion page',
    s6_3_end: ').',
    s6_4: 'Disconnect Meta or WhatsApp at any time.',
    s7_h: '7. Cookies',
    s7_p: 'We use essential cookies for session management, and Meta Pixel + Google Tag Manager for measurement. You can block cookies in your browser settings (may affect functionality).',
    s8_h: '8. Changes to this policy',
    s8_p: 'If we change this policy, we’ll update the date at the top. Material changes will also be emailed.',
    s9_h: '9. Contact',
    s9_p_1: 'For any privacy question:',
    s9_p_wa: 'or on WhatsApp:',
  },
  he: {
    title: 'מדיניות פרטיות',
    updated: 'עודכן לאחרונה: יולי 2026',
    intro: 'Adigo (להלן: "השירות", "אנחנו") מכבדת את פרטיותך. מסמך זה מסביר אילו פרטים אנו אוספים, איך אנו משתמשים בהם, ועם מי הם משותפים. השירות מסופק על ידי איתי בינדר.',
    s1_h: '1. אילו פרטים אנו אוספים',
    s1_1: 'פרטים שמסרת בעת ההרשמה: שם מלא, כתובת אימייל ומספר טלפון.',
    s1_2: 'פרטי החיבור לחשבונות חיצוניים: Meta Ads ו-WhatsApp (נשמרים מוצפנים).',
    s1_3: 'תוכן שאתה מעלה דרך השירות: תמונות, סרטונים וטקסטים שאתה שולח לבוט.',
    s1_4: 'נתוני שימוש: כניסות, פעולות, אירועי מערכת לצרכי תפעול ושיפור המוצר.',
    s1_5: 'נתוני תשלום: מטופלים על ידי Cardcom; אנו שומרים רק טוקן ומועד תפוגה, לא פרטי כרטיס.',
    s2_h: '2. מטרות השימוש במידע',
    s2_1: 'אספקת השירות: העלאת קריאייטיבים, ניהול קמפיינים, תקשורת עם ה-API של Meta.',
    s2_2: 'תמיכה ושירות לקוחות.',
    s2_3: 'שיפור המוצר וניתוח שימוש מצרפי (לא מזהה).',
    s2_4: 'חיוב ותפעול המנוי.',
    s2_5: 'שליחת עדכוני שירות חשובים באימייל ובוואצפ.',
    s3_h: '3. שיתוף מידע עם צדדים שלישיים',
    s3_intro: 'אנו לא מוכרים את המידע שלך. שיתוף מוגבל לספקי שירות הכרחיים:',
    s3_1: 'Meta Platforms, Inc.',
    s3_1_desc: '— להעלאת קריאייטיבים וקריאות API לחשבון המודעות שלך.',
    s3_2: 'Supabase',
    s3_2_desc: '— אחסון בסיס נתונים.',
    s3_3: 'Cardcom',
    s3_3_desc: '— סליקת תשלומים.',
    s3_4: 'GreenAPI',
    s3_4_desc: '— שליחת התראות תפעוליות באמצעות WhatsApp.',
    s3_5: 'Vercel',
    s3_5_desc: '— אירוח האפליקציה.',
    s4_h: '4. אבטחת מידע',
    s4_p: 'כל הטוקנים והפרטים הרגישים מוצפנים בעת השמירה. התקשורת מאובטחת ב-SSL. אנו מיישמים בקרת גישה מבוססת תפקידים ומעבירים פרטי אשראי דרך Cardcom בלבד.',
    s5_h: '5. שמירת מידע',
    s5_p: 'אנו שומרים את המידע שלך כל עוד החשבון שלך פעיל. לאחר ביטול מנוי או בקשת מחיקה — המידע ימחק תוך 30 ימים, למעט מידע שאנו חייבים בחוק לשמור (כגון תיעוד חשבוניות).',
    s6_h: '6. הזכויות שלך',
    s6_intro: 'זכותך:',
    s6_1: 'לגשת לנתונים שלך.',
    s6_2: 'לתקן מידע שגוי.',
    s6_3: 'לבקש מחיקה (ראה',
    s6_3_link: 'דף מחיקת נתונים',
    s6_3_end: ').',
    s6_4: 'לנתק את החיבור ל-Meta או ל-WhatsApp בכל רגע.',
    s7_h: '7. עוגיות (Cookies)',
    s7_p: 'אנו משתמשים בעוגיות הכרחיות לשמירת ההתחברות ותפעול האתר, וב-Meta Pixel ו-Google Tag Manager לצרכי מדידה. אפשר לחסום עוגיות בהגדרות הדפדפן (זה עלול לפגוע בתפקוד).',
    s8_h: '8. שינויים במדיניות',
    s8_p: 'במידה ונשנה את המדיניות, נעדכן את התאריך בראש הדף. שינויים מהותיים יישלחו גם באימייל.',
    s9_h: '9. יצירת קשר',
    s9_p_1: 'לכל שאלה בנוגע לפרטיות:',
    s9_p_wa: 'או בוואצפ:',
  },
} as const

export default function PrivacyPage() {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-200 py-16 px-6">
      <div className="max-w-3xl mx-auto" dir={dir}>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{t.title}</h1>
        <p className="text-zinc-500 mb-10">{t.updated}</p>

        <section className="space-y-6 leading-relaxed text-lg">
          <p>{t.intro}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s1_h}</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{t.s1_1}</li>
            <li>{t.s1_2}</li>
            <li>{t.s1_3}</li>
            <li>{t.s1_4}</li>
            <li>{t.s1_5}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s2_h}</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{t.s2_1}</li>
            <li>{t.s2_2}</li>
            <li>{t.s2_3}</li>
            <li>{t.s2_4}</li>
            <li>{t.s2_5}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s3_h}</h2>
          <p>{t.s3_intro}</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>{t.s3_1}</strong> {t.s3_1_desc}</li>
            <li><strong>{t.s3_2}</strong> {t.s3_2_desc}</li>
            <li><strong>{t.s3_3}</strong> {t.s3_3_desc}</li>
            <li><strong>{t.s3_4}</strong> {t.s3_4_desc}</li>
            <li><strong>{t.s3_5}</strong> {t.s3_5_desc}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s4_h}</h2>
          <p>{t.s4_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s5_h}</h2>
          <p>{t.s5_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s6_h}</h2>
          <p>{t.s6_intro}</p>
          <ul className="list-disc list-inside space-y-2">
            <li>{t.s6_1}</li>
            <li>{t.s6_2}</li>
            <li>{t.s6_3}{' '}
              <a href="/data-deletion" className="text-emerald-400 underline">{t.s6_3_link}</a>
              {t.s6_3_end}
            </li>
            <li>{t.s6_4}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s7_h}</h2>
          <p>{t.s7_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s8_h}</h2>
          <p>{t.s8_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s9_h}</h2>
          <p>
            {t.s9_p_1}{' '}
            <a href="mailto:itay@binder.co.il" className="text-emerald-400 underline">itay@binder.co.il</a>{' '}
            {t.s9_p_wa}{' '}
            <a href="https://wa.me/972526660006" className="text-emerald-400 underline">+972-52-666-0006</a>.
          </p>
        </section>
      </div>
    </main>
  )
}
