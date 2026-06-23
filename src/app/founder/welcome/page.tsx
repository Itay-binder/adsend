import type { Metadata } from 'next'
import Image from 'next/image'
import { Check, MessageCircle, Calendar, BookOpen, Users } from 'lucide-react'

export const metadata: Metadata = {
  title: 'ברוך הבא למייסדים — Adigo',
  description: 'תודה שהצטרפת ל-Founder Pack של Adigo',
}

export default function FounderWelcomePage() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      <section className="px-6 pt-20 pb-10 max-w-3xl mx-auto" dir="rtl">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Image src="/adigo-icon.png" alt="Adigo" width={56} height={56} className="rounded-full" priority />
          <span className="text-2xl font-black">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>

        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center">
            <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-center leading-tight mb-5">
          ברוך הבא,
          <br />
          <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
            מייסד של Adigo.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-300 text-center max-w-xl mx-auto leading-relaxed mb-12">
          התשלום התקבל. עכשיו מתחיל החלק הכיפי.
          <br />
          <span className="text-white font-bold">אני מסיים את ההכנה האישית שלך ב-24 השעות הקרובות.</span>
        </p>

        <a
          href="https://wa.me/972526660006"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 max-w-md mx-auto py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-colors mb-16"
        >
          <MessageCircle className="w-5 h-5" />
          פתח שיחה עם איתי בווצאפ
        </a>
      </section>

      <section className="px-6 py-10 max-w-3xl mx-auto" dir="rtl">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">מה קורה עכשיו?</h2>
        <p className="text-zinc-400 text-center mb-12 text-lg">3 צעדים, 24 שעות.</p>

        <div className="space-y-4">
          <StepRow
            n={1}
            icon={Calendar}
            title="אני שולח לך וואצפ אישי תוך 24 שעות"
            text="עם הקישור להדרכה המוקלטת, הזמנה לרפו של GitHub, וקישור לקבוצת המייסדים. נקבע גם זמן קצר לקפיצה לזום אם תרצה (אופציונלי)."
          />
          <StepRow
            n={2}
            icon={BookOpen}
            title="תצפה בהדרכה לפי הקצב שלך"
            text="3 סרטונים בני 10-15 דקות. אפשר לעבור הכל בערב אחד, אפשר לאט. הסקיל מגיע בנפרד עם הוראות התקנה ל-Claude / ChatGPT."
          />
          <StepRow
            n={3}
            icon={Users}
            title="מצטרף לקבוצת המייסדים"
            text="30 קמפיינרים שמשתפים שיפורים, פתרונות תקלות, וקצרי דרך. רשת תמיכה אמיתית של אנשים שמשתמשים באותה מערכת כמוך."
          />
        </div>
      </section>

      <section className="px-6 py-16 max-w-2xl mx-auto" dir="rtl">
        <div className="bg-gradient-to-br from-sky-950/50 via-zinc-900 to-emerald-950/50 border border-sky-500/20 rounded-3xl p-8 md:p-10 text-center">
          <p className="text-lg leading-relaxed mb-3">
            תודה שאתה אחד מה-30. אני לא לוקח את זה כמובן מאליו.
          </p>
          <p className="text-zinc-300 leading-relaxed">
            המייסדים האלה הם האנשים שיעצבו איך Adigo תיראה בעוד שנה. הפידבק שלך באמת חשוב לי.
          </p>
          <p className="text-emerald-400 font-bold mt-6">— איתי</p>
        </div>
      </section>

      <footer className="border-t border-zinc-800 py-10 text-center text-sm text-zinc-500 px-6">
        <p>
          שאלה דחופה?{' '}
          <a href="https://wa.me/972526660006" className="text-zinc-300 hover:text-white underline">
            וואצפ ישיר לאיתי
          </a>
        </p>
      </footer>
    </div>
  )
}

function StepRow({
  n,
  icon: Icon,
  title,
  text,
}: {
  n: number
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
}) {
  return (
    <div dir="rtl" className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
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
