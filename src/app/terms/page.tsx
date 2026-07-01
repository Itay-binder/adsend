'use client'

import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'

const T = {
  en: {
    title: 'Terms of service',
    updated: 'Last updated: July 2026',
    intro: 'Welcome to Adigo. Using the service is subject to the terms below. Signing in and using the service is your agreement to these terms. If you don’t agree — please don’t use the service.',
    s1_h: '1. What the service does',
    s1_p: 'Adigo lets media buyers and Meta Ads users push creatives to their ad accounts through WhatsApp messages. The service connects to Meta’s API via OAuth and to your WhatsApp account via a personal Baileys connection.',
    s2_h: '2. Signup and subscription',
    s2_1: 'Signup requires a valid Google account and phone number.',
    s2_2: '7-day free trial. When the trial ends, monthly billing of ₪99 begins (unless canceled beforehand).',
    s2_3: 'Cancel any time from the settings or by messaging us — no penalty.',
    s2_4: 'Monthly charges are not refunded for unused days, unless we specify otherwise.',
    s3_h: '3. Your responsibility',
    s3_1: 'You’re responsible for the content of the creatives you upload — compliance with Meta’s policies and the law.',
    s3_2: 'Do not use the service to promote prohibited, harmful, infringing, or misleading content.',
    s3_3: 'You declare you have the right to publish the material you upload.',
    s3_4: 'Your ad account budget is controlled by you — Adigo does not pay for your budgets.',
    s4_h: '4. Limitation of liability',
    s4_p: 'The service is provided "As Is". We’ll make every reasonable effort to keep it available, correct, and functional — but we are not responsible for indirect damages, lost profits, or issues stemming from third-party services (Meta, WhatsApp, Cardcom).',
    s5_h: '5. Intellectual property',
    s5_p: 'All rights in the code, design, technology, and Adigo brand belong to Itay Binder. The creatives you upload remain fully yours. You grant us a limited license to process them solely to deliver the service.',
    s6_h: '6. Termination',
    s6_p: 'We may suspend or terminate an account for abuse, violations of Meta’s policy, or overdue payment. In such a case you’ll be notified with reasonable time to act. In exceptional cases (security, legal violations) — immediate termination.',
    s7_h: '7. Changes to these terms',
    s7_p: 'We may update these terms from time to time. Material changes will be sent by email. Continued use after an update constitutes acceptance of the new terms.',
    s8_h: '8. Governing law',
    s8_p: 'These terms are governed by the laws of the State of Israel. Exclusive jurisdiction lies with the competent courts in the Tel Aviv district.',
    s9_h: '9. Contact',
    s9_p_1: 'For any question about these terms:',
    s9_p_wa: 'or on WhatsApp:',
  },
  he: {
    title: 'תנאי שימוש',
    updated: 'עודכן לאחרונה: יולי 2026',
    intro: 'ברוכים הבאים ל-Adigo. השימוש בשירות כפוף לתנאים שלהלן. כניסה לשירות והרשמה מהווים את הסכמתך המלאה לתנאים אלה. אם אינך מסכים — אנא הימנע משימוש בשירות.',
    s1_h: '1. מהות השירות',
    s1_p: 'Adigo מאפשרת קמפיינרים ומשתמשי Meta Ads להעלות קריאייטיבים לחשבון המודעות שלהם באמצעות הודעות WhatsApp. השירות מתחבר ל-API של Meta דרך OAuth ולחשבון WhatsApp שלך דרך חיבור אישי.',
    s2_h: '2. רישום ומנוי',
    s2_1: 'הרשמה דורשת חשבון Google תקין ומספר טלפון.',
    s2_2: 'ניסיון חינם בן 7 ימים. בסיום הניסיון מתחיל חיוב חודשי של ₪99 (אלא אם בוטל מראש).',
    s2_3: 'ביטול אפשרי בכל רגע מתוך ההגדרות או בפנייה ישירה — ללא קנס.',
    s2_4: 'החיובים החודשיים אינם מוחזרים בגין ימים בלתי מנוצלים, אלא אם נקבע אחרת על ידינו.',
    s3_h: '3. אחריות המשתמש',
    s3_1: 'אתה אחראי לתוכן הקריאייטיבים שאתה מעלה — לעמידתם במדיניות Meta ובחוק.',
    s3_2: 'אסור להשתמש בשירות לקידום תוכן אסור, פוגעני, מפר זכויות יוצרים או מטעה.',
    s3_3: 'אתה מצהיר שיש לך זכות לפרסם את החומרים שאתה מעלה.',
    s3_4: 'חיוב חשבון המודעות שלך נשלט מצידך — Adigo לא משלם עבור התקציבים שלך.',
    s4_h: '4. הגבלת אחריות',
    s4_p: 'השירות מסופק "כמו שהוא" (As Is). אנו נעשה כל מאמץ סביר להבטיח זמינות, נכונות ותפקוד תקין — אך לא נישא באחריות לנזק עקיף, אובדן רווחים, או תקלות הנובעות משירותי צד שלישי (כגון Meta, WhatsApp, Cardcom).',
    s5_h: '5. קניין רוחני',
    s5_p: 'כל הזכויות בקוד, בעיצוב, בטכנולוגיה ובמותג Adigo שייכות לאיתי בינדר. הקריאייטיבים שאתה מעלה נשארים בבעלותך המלאה. אתה מעניק לנו רישיון מוגבל לעבד אותם לצורך אספקת השירות בלבד.',
    s6_h: '6. הפסקת שירות',
    s6_p: 'אנו רשאים להשעות או לסיים חשבון אם נתגלה שימוש לרעה, הפרת מדיניות Meta, או חוב בתשלום. במקרה כזה תקבל הודעה ויינתן זמן סביר לפעול. במקרים חריגים (אבטחה, הפרת חוק) — הפסקה מיידית.',
    s7_h: '7. שינויים בתנאים',
    s7_p: 'אנו רשאים לעדכן את התנאים מעת לעת. שינויים מהותיים יישלחו בהודעה באימייל. המשך שימוש לאחר עדכון מהווה הסכמה לתנאים החדשים.',
    s8_h: '8. דין שיפוט',
    s8_p: 'התנאים כפופים לדיני מדינת ישראל. סמכות שיפוט בלעדית לבתי המשפט המוסמכים במחוז תל אביב.',
    s9_h: '9. יצירת קשר',
    s9_p_1: 'לכל שאלה בנוגע לתנאים:',
    s9_p_wa: 'או בוואצפ:',
  },
} as const

export default function TermsPage() {
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
          <p>{t.s1_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s2_h}</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{t.s2_1}</li>
            <li>{t.s2_2}</li>
            <li>{t.s2_3}</li>
            <li>{t.s2_4}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s3_h}</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>{t.s3_1}</li>
            <li>{t.s3_2}</li>
            <li>{t.s3_3}</li>
            <li>{t.s3_4}</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s4_h}</h2>
          <p>{t.s4_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s5_h}</h2>
          <p>{t.s5_p}</p>

          <h2 className="text-2xl font-bold text-white pt-6">{t.s6_h}</h2>
          <p>{t.s6_p}</p>

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
