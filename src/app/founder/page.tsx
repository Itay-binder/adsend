'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FadeIn } from '@/components/landing/fade-in'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Code2,
  GitBranch,
  Infinity as InfinityIcon,
  PlayCircle,
  Sparkles,
  Wand2,
  Users,
  Lock,
} from 'lucide-react'

export default function FounderPage() {
  return (
    <div className="bg-zinc-950 text-white min-h-screen">
      {/* HERO */}
      <section className="px-6 pt-16 pb-12 max-w-5xl mx-auto">
        <FadeIn className="flex items-center justify-center gap-3 mb-8">
          <Image src="/adigo-icon.png" alt="Adigo" width={56} height={56} className="rounded-full" priority />
          <span className="text-2xl font-black">
            Adi<span className="text-sky-400">go</span>
          </span>
        </FadeIn>

        <FadeIn delay={80} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">Founder Pack — 30 מקומות בלבד</span>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center leading-[1.15] mb-6">
            תכננתי SaaS.
            <br />
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              עכשיו אני נותן לכם את הכל.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="text-lg md:text-xl text-zinc-300 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            הקוד המלא של Adigo + הסקיל + הדרכת הטמעה מוקלטת.
            <br />
            <span className="text-white font-bold">לבעלותך לתמיד. בלי מנוי. בלי הגבלה.</span>
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <LeadForm />
        </FadeIn>

        <FadeIn delay={550} className="flex justify-center mt-6">
          <p className="text-sm text-zinc-500">
            <span className="text-emerald-400 font-bold">23 מקומות נותרו</span> מתוך 30
          </p>
        </FadeIn>
      </section>

      {/* THE PIVOT STORY */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            רגע. למה לקחת קוד שלם ב-250₪?
          </h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-6 text-lg text-zinc-300 leading-relaxed">
          <p>תכננתי את Adigo כשירות מנוי — 99₪ לחודש. תרשמו, תחברו, תעבדו.</p>

          <p>
            אבל יש חסם אחד שלא חשבתי עליו: <span className="text-white font-bold">Meta דורשים אישור App Review</span>.
            בלי האישור — אני יכול לתת גישה ל-100 משתמשים בלבד, כל אחד צריך לאשר ידנית כ-tester בפייסבוק, וזה
            תהליך של 5-10 דקות לכל לקוח. לא בר־קיימא.
          </p>

          <p>
            תהליך האישור לוקח 4-8 שבועות. ואני לא רוצה לחכות.
          </p>

          <p className="text-2xl font-black text-white pt-2">
            אז במקום למכור גישה, החלטתי לשתף הכל.
          </p>

          <div className="bg-gradient-to-br from-emerald-500/10 to-sky-500/5 border border-emerald-500/30 rounded-3xl p-7 md:p-10">
            <p className="text-lg leading-relaxed">
              30 קמפיינרים מקבלים את <span className="text-white font-bold">הקוד המלא</span> של Adigo, את{' '}
              <span className="text-white font-bold">הסקיל המקצועי</span> שמלמד איך לעבוד איתו,
              ואת <span className="text-white font-bold">הדרכת ההטמעה</span> המוקלטת — בכל זמן שתרצו.
            </p>
            <p className="text-lg leading-relaxed mt-4">
              הכל יושב אצלך. עם ידע טכני בסיסי — אתה אפילו יכול לשפר את הקוד ולהתאים אותו לעצמך.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">מה כלול בחבילה</h2>
          <p className="text-zinc-400 text-center mb-14 text-lg">הכל. בלי כוכביות.</p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-5">
          <FadeIn delay={0}>
            <IncludedCard icon={Code2} title="כל קוד המקור">
              ריפו GitHub מלא — Next.js + Baileys server + Supabase schema. אפס שכבות מוסתרות. אתה הופך
              לבעלים של הקוד מהרגע הראשון.
            </IncludedCard>
          </FadeIn>
          <FadeIn delay={100}>
            <IncludedCard icon={Wand2} title="סקיל Adigo Pro">
              סקיל מקצועי לעבודה עם Claude/ChatGPT — אסטרטגיית קריאייטיב, נומנקלטורת קמפיינים, workflow
              יומי, ופתרון תקלות.
            </IncludedCard>
          </FadeIn>
          <FadeIn delay={200}>
            <IncludedCard icon={PlayCircle} title="3 סרטוני הדרכה מוקלטים">
              התקנה ב-3 דקות, ה-workflow היומי שלי, ושימוש מתקדם בסקיל. צפייה חופשית, בקצב שלך, ללא הגבלה.
            </IncludedCard>
          </FadeIn>
          <FadeIn delay={300}>
            <IncludedCard icon={GitBranch} title="חופש לעדכן ולשנות">
              אתה הבעלים. עם ידע טכני בסיסי (או מפתח שאתה שוכר) — אפשר לעדכן צבעים, להוסיף פיצ'רים,
              לחבר לבסיס נתונים שלך, מה שמתאים לך.
            </IncludedCard>
          </FadeIn>
          <FadeIn delay={400}>
            <IncludedCard icon={Users} title="קבוצת ווצאפ של מייסדים">
              30 קמפיינרים שמשתפים פתרונות, שיפורים, וקצרי דרך. רשת תמיכה פנים אל פנים.
            </IncludedCard>
          </FadeIn>
          <FadeIn delay={500}>
            <IncludedCard icon={InfinityIcon} title="אין מנוי. אין הגבלה.">
              עלות חד-פעמית. בלי "אחרי 7 ימים", בלי שדרוגים, בלי "המנוי שלך יסתיים בעוד 30 ימים".
              הקוד שלך לתמיד.
            </IncludedCard>
          </FadeIn>
        </div>
      </section>

      {/* PRICING LOGIC */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">המתמטיקה</h2>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-7 md:p-10 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
              <div>
                <p className="text-zinc-400 line-through">תוכנן: SaaS חודשי</p>
                <p className="text-2xl font-bold text-zinc-500 line-through">99₪ / חודש</p>
              </div>
              <p className="text-sm text-zinc-500">= 1,188₪ לשנה</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300">Founder Pack</p>
                <p className="text-4xl md:text-5xl font-black text-emerald-400">250₪</p>
                <p className="text-sm text-zinc-400 mt-1">תשלום חד-פעמי</p>
              </div>
              <div className="text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-bold">לתמיד</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-300 leading-relaxed pt-2 border-t border-zinc-800">
              250₪ פעם אחת לעומת 99₪ חודש אחר חודש. <span className="text-white font-bold">החזר השקעה תוך 3 חודשים</span>,
              ואחרי זה — כל חודש זה רווח נקי לעומת תשלום SaaS חוזר.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="mt-10">
          <LeadForm />
        </FadeIn>
      </section>

      {/* WHO IT'S FOR */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">למי זה מתאים?</h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-4">
          <BenefitRow text="קמפיינרים פרילנסרים שמנהלים 3+ לקוחות ועייפים מהעבודה השחורה" />
          <BenefitRow text="סוכנויות קטנות שרוצות לחסוך 4-8 שעות בשבוע על העלאות" />
          <BenefitRow text="בעלי עסקים שמנהלים את הקמפיינים שלהם בעצמם ולא רוצים לפתוח Ads Manager 10 פעמים ביום" />
          <BenefitRow text="כל מי שמעדיף בעלות על הקוד מאשר תלות במנוי" />
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">שאלות נפוצות</h2>
        </FadeIn>

        <div className="space-y-3">
          <FadeIn delay={0}>
            <FaqItem question="צריך להיות מפתח כדי להתקין?">
              <p>
                לא. ההדרכה המוקלטת מובילה אותך צעד אחר צעד — דורש בערך 30-45 דקות בפעם הראשונה.
                התקנה ב-Vercel + Supabase (שירותים חינמיים), חיבור Meta + WhatsApp. אם נתקעת —
                בקבוצת המייסדים יעזרו לך תוך דקות.
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={80}>
            <FaqItem question="מה אם אני לא רוצה להתעסק עם קוד אחר כך?">
              <p>
                אין צורך. אחרי ההתקנה הראשונית — המערכת רצה לבד. הקוד פתוח אם תרצה לשנות
                משהו בעתיד, אבל זה לא חובה.
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={160}>
            <FaqItem question="האם אקבל עדכונים אם אתה משפר את Adigo?">
              <p>
                כן. מייסדים מקבלים גישה ל-repo המעודכן ל-12 חודשים, וכל שיפור שאעשה
                מועבר אוטומטית. אחרי שנה — אתה ממשיך עם הגרסה האחרונה שיש בידך, ויכול להמשיך
                לעדכן בעצמך.
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={240}>
            <FaqItem question="מה לגבי Meta App? עדיין צריך לעבור Review?">
              <p>
                לא חובה — אם אתה משתמש במערכת רק לעצמך או לכמה לקוחות שאתה מוסיף ידנית כ-testers,
                אתה לא צריך App Review. אם תרצה לפתוח את זה לעוד אנשים — תוכל להגיש Review של
                אפליקציית Meta שלך בעצמך (ההדרכה כוללת מסמך עם הוראות מדויקות).
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={320}>
            <FaqItem question="זה רעיון פתוח? יכול לבוא מתחרה ולמכור את זה?">
              <p>
                המוצר נמסר עם רישיון אישי בלבד. אתה יכול להשתמש, לערוך, ולמכור שירות מבוסס עליו —
                אבל לא לארוז ולמכור אותו מחדש כמוצר משלך. כל הפרטים בהסכם שיועבר בקריאת ההתקנה.
              </p>
            </FaqItem>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            רוצה להיות אחד מ-30?
          </h2>
          <p className="text-lg text-zinc-300 mb-10">
            השאר פרטים ואני אחזור אליך תוך 24 שעות עם הצעדים הבאים והקישור לתשלום.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <LeadForm />
        </FadeIn>
      </section>

      <footer className="border-t border-zinc-800 py-10 text-center text-sm text-zinc-500 px-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image src="/adigo-icon.png" alt="Adigo" width={28} height={28} className="rounded-full" />
          <span className="font-black">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>
        <p>בנוי לקמפיינרים, ע״י קמפיינר.</p>
        <p className="mt-2">
          תמיכה:{' '}
          <a href="https://wa.me/972526660006" className="text-zinc-400 hover:text-white">
            +972-52-666-0006
          </a>
        </p>
      </footer>
    </div>
  )
}

function LeadForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/founder-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(j.error ?? 'שגיאה. נסה שוב.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div
        dir="rtl"
        className="max-w-md mx-auto bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 rounded-3xl p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3">קיבלתי. אני חוזר אליך.</h3>
        <p className="text-zinc-300 leading-relaxed">
          אצור איתך קשר אישית בוואצפ תוך 24 שעות עם הצעדים הבאים והקישור לתשלום.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      dir="rtl"
      className="max-w-md mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-7 space-y-4"
    >
      <div>
        <label htmlFor="founder-name" className="block text-sm font-bold text-zinc-300 mb-1.5">
          שם מלא
        </label>
        <input
          id="founder-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: יוסי לוי"
          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="founder-phone" className="block text-sm font-bold text-zinc-300 mb-1.5">
          טלפון
        </label>
        <input
          id="founder-phone"
          type="tel"
          inputMode="numeric"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050-1234567"
          dir="ltr"
          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-center font-bold text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim() || phone.replace(/\D/g, '').length < 9}
        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-black text-base shadow-lg shadow-emerald-500/20 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? 'שולח...' : 'אני רוצה להיות מייסד'}
        {!loading && <ArrowLeft className="w-4 h-4" />}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        אחזור אליך אישית בוואצפ תוך 24 שעות
      </p>
    </form>
  )
}

function IncludedCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      dir="rtl"
      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-full hover:border-emerald-500/30 transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-300 leading-relaxed">{children}</p>
    </div>
  )
}

function BenefitRow({ text }: { text: string }) {
  return (
    <div
      dir="rtl"
      className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
      <p className="text-zinc-200 leading-relaxed pt-1">{text}</p>
    </div>
  )
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="bg-zinc-900/60 border border-zinc-800 rounded-2xl group open:border-zinc-700 transition-colors" dir="rtl">
      <summary className="cursor-pointer p-6 flex items-center justify-between gap-4 font-bold text-lg list-none">
        <span>{question}</span>
        <ChevronDown className="w-5 h-5 text-zinc-500 transition-transform group-open:rotate-180 shrink-0" />
      </summary>
      <div className="px-6 pb-6 text-zinc-300 leading-relaxed border-t border-zinc-800 pt-5">{children}</div>
    </details>
  )
}
