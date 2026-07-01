'use client'

import Image from 'next/image'
import { Check, MessageCircle, Calendar, BookOpen, Users } from 'lucide-react'
import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'

const T = {
  en: {
    hero_line_1: 'Welcome,',
    hero_line_2: 'Adigo founder.',
    hero_p_1: 'Payment received. Now the fun part begins.',
    hero_p_2: 'I’m finalizing your personal onboarding in the next 24 hours.',
    hero_cta: 'Open a WhatsApp chat with Itay',
    steps_h2: 'What happens next?',
    steps_sub: '3 steps, 24 hours.',
    step1_title: 'I DM you on WhatsApp within 24 hours',
    step1_text: 'You’ll get the link to the recorded training, a GitHub repo invite, and the founders group. We’ll also schedule a short optional Zoom if you want one.',
    step2_title: 'You watch the training at your own pace',
    step2_text: '3 videos, 10-15 minutes each. Do it all in one evening or spread it out. The skill ships separately with install instructions for Claude / ChatGPT.',
    step3_title: 'Join the founders group',
    step3_text: '30 media buyers sharing improvements, fixes, and shortcuts. A real support network of people using the same system as you.',
    thanks_1: 'Thanks for being one of the 30. I don’t take that lightly.',
    thanks_2: 'These founders are the people who’ll shape what Adigo becomes in the next year. Your feedback matters to me.',
    thanks_sig: '— Itay',
    footer_q: 'Urgent question?',
    footer_link: 'DM me on WhatsApp',
  },
  he: {
    hero_line_1: 'ברוך הבא,',
    hero_line_2: 'מייסד של Adigo.',
    hero_p_1: 'התשלום התקבל. עכשיו מתחיל החלק הכיפי.',
    hero_p_2: 'אני מסיים את ההכנה האישית שלך ב-24 השעות הקרובות.',
    hero_cta: 'פתח שיחה עם איתי בווצאפ',
    steps_h2: 'מה קורה עכשיו?',
    steps_sub: '3 צעדים, 24 שעות.',
    step1_title: 'אני שולח לך וואצפ אישי תוך 24 שעות',
    step1_text: 'עם הקישור להדרכה המוקלטת, הזמנה לרפו של GitHub, וקישור לקבוצת המייסדים. נקבע גם זמן קצר לקפיצה לזום אם תרצה (אופציונלי).',
    step2_title: 'תצפה בהדרכה לפי הקצב שלך',
    step2_text: '3 סרטונים בני 10-15 דקות. אפשר לעבור הכל בערב אחד, אפשר לאט. הסקיל מגיע בנפרד עם הוראות התקנה ל-Claude / ChatGPT.',
    step3_title: 'מצטרף לקבוצת המייסדים',
    step3_text: '30 קמפיינרים שמשתפים שיפורים, פתרונות תקלות, וקצרי דרך. רשת תמיכה אמיתית של אנשים שמשתמשים באותה מערכת כמוך.',
    thanks_1: 'תודה שאתה אחד מה-30. אני לא לוקח את זה כמובן מאליו.',
    thanks_2: 'המייסדים האלה הם האנשים שיעצבו איך Adigo תיראה בעוד שנה. הפידבק שלך באמת חשוב לי.',
    thanks_sig: '— איתי',
    footer_q: 'שאלה דחופה?',
    footer_link: 'וואצפ ישיר לאיתי',
  },
} as const

export default function FounderWelcomePage() {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]

  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      <section className="px-6 pt-20 pb-10 max-w-3xl mx-auto" dir={dir}>
        <div className="flex items-center justify-center gap-3 mb-10">
          <Image src="/adigo-icon.png" alt="Adigo" width={56} height={56} className="rounded-full" priority />
          <span className="text-2xl font-black" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-center leading-tight mb-5">
          {t.hero_line_1}
          <br />
          <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            {t.hero_line_2}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 text-center max-w-xl mx-auto leading-relaxed mb-12">
          {t.hero_p_1}
          <br />
          <span className="text-white font-bold">{t.hero_p_2}</span>
        </p>

        <a
          href="https://wa.me/972526660006"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 max-w-md mx-auto py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-colors mb-16"
        >
          <MessageCircle className="w-5 h-5" />
          {t.hero_cta}
        </a>
      </section>

      <section className="px-6 py-10 max-w-3xl mx-auto" dir={dir}>
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">{t.steps_h2}</h2>
        <p className="text-zinc-400 text-center mb-12 text-lg">{t.steps_sub}</p>

        <div className="space-y-4">
          <StepRow n={1} icon={Calendar} title={t.step1_title} text={t.step1_text} dir={dir} />
          <StepRow n={2} icon={BookOpen} title={t.step2_title} text={t.step2_text} dir={dir} />
          <StepRow n={3} icon={Users} title={t.step3_title} text={t.step3_text} dir={dir} />
        </div>
      </section>

      <section className="px-6 py-16 max-w-2xl mx-auto" dir={dir}>
        <div className="bg-gradient-to-br from-sky-950/50 via-zinc-900 to-emerald-950/50 border border-sky-500/20 rounded-3xl p-8 md:p-10 text-center">
          <p className="text-lg leading-relaxed mb-3">
            {t.thanks_1}
          </p>
          <p className="text-zinc-300 leading-relaxed">
            {t.thanks_2}
          </p>
          <p className="text-emerald-400 font-bold mt-6">{t.thanks_sig}</p>
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-10 text-center text-sm text-zinc-500 px-6">
        <p>
          {t.footer_q}{' '}
          <a href="https://wa.me/972526660006" className="text-zinc-300 hover:text-white underline">
            {t.footer_link}
          </a>
        </p>
      </footer>
    </div>
  )
}

function StepRow({
  n, icon: Icon, title, text, dir,
}: {
  n: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  dir: 'ltr' | 'rtl'
}) {
  return (
    <div dir={dir} className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
      <div className="shrink-0 flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black">
          {n}
        </div>
        <Icon className="w-5 h-5 text-zinc-500" />
      </div>
      <div className="pt-1">
        <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
        <p className="text-zinc-300 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
