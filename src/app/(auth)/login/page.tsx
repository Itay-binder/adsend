'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { trackCustom } from '@/components/meta-pixel'
import { FadeIn } from '@/components/landing/fade-in'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Globe,
  Layers,
  Lock,
  MessageCircle,
  Sparkles,
  Tag,
  Wand2,
} from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | null>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    trackCustom('login')
    const onScroll = () => setStickyVisible(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function signIn() {
    setLoading('google')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
    if (error) {
      toast.error('שגיאה בהתחברות, נסה שוב')
      setLoading(null)
    }
  }

  return (
    <div className="bg-zinc-950 text-white">
      <StickyHeader visible={stickyVisible} loading={loading} signIn={signIn} />

      {/* HERO */}
      <section className="px-6 pt-16 pb-16 max-w-5xl mx-auto">
        <FadeIn className="flex items-center justify-center gap-3 mb-10">
          <Image src="/adigo-icon.png" alt="Adigo" width={60} height={60} className="rounded-full" priority />
          <span className="text-3xl font-black">
            Adi<span className="text-sky-400">go</span>
          </span>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center leading-[1.15] mb-8">
            הקריאייטיב הוא המלך.
            <br />
            אבל אתה?{' '}
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              צוואר הבקבוק שלו.
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={250}>
          <p className="text-lg md:text-2xl text-zinc-300 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            תתחיל להעלות מודעות לממומן מהווצאפ.
            <br />
            <span className="text-white font-bold">תוך 30 שניות. מכל מקום. בלי לפתוח מנהל מודעות.</span>
          </p>
        </FadeIn>

        <FadeIn delay={400} className="flex flex-col items-center gap-3 mb-10">
          <GoogleButton size="lg" loading={loading} onClick={signIn} />
          <p className="text-xs text-zinc-500" dir="rtl">לוקח לך 2 דקות להתחיל</p>
        </FadeIn>

        <FadeIn delay={500} className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-sm">7 ימי ניסיון בחינם</span>
          </div>
        </FadeIn>
      </section>

      {/* TRUST BAR */}
      <FadeIn>
        <section className="bg-zinc-900/40 border-y border-zinc-800 py-5">
          <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-400">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              SSL מוצפן
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              חברה ישראלית, תמיכה בעברית
            </span>
          </div>
        </section>
      </FadeIn>

      {/* DEMO VIDEO */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">ככה זה נראה בפועל</h2>
          <p className="text-zinc-400 text-center mb-12 text-lg">שולח לקמפיינר שלך. אומר לאיזה קמפיין. סיימת.</p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className="flex justify-center">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/adigo-icon.png"
              className="w-[90%] md:w-auto md:h-[60vh] rounded-3xl border border-zinc-800 shadow-2xl shadow-emerald-500/10 block bg-zinc-900"
            >
              <source src="/adigo-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </FadeIn>
      </section>

      {/* PAIN */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            בוא נשים את הדברים על השולחן.
          </h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-6 text-lg text-zinc-300 leading-relaxed">
          <p>גיוון בקריאייטיב היום הוא דרמטי.</p>
          <p>
            יכול להיות שאתה אסטרטג על וסופר מקצוען, ואפילו חופר ללקוח שלך על כמה חשוב לייצר עוד תכנים.
          </p>
          <p className="text-2xl font-black text-white">
            אבל ברגע האמת שהקריאייטיבים הגיעו, אין לך כוח.
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-14 bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-3xl p-8 md:p-10">
            <p className="text-lg text-zinc-300 mb-8 leading-relaxed">
              לא משנה איך תסובב את זה, זאת{' '}
              <span className="text-red-400 font-bold">עבודה שחורה</span>:
            </p>

            <div className="space-y-5">
              <PainRow icon={Download} text="להעביר את הקריאייטיבים באיכות גבוהה" />
              <PainRow icon={Layers} text="לפתוח כל מודעה בנפרד בכל סדרת מודעות" />
              <PainRow icon={Clock} text="להעלות את הקריאייטיב לחשבון מודעות ולחכות עד שמטא תעבד אותו" />
              <PainRow icon={Tag} text="לתת שם שונה לכל מודעה ולהתאים את ה-UTM בכל אחת מהמודעות" />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="mt-10 text-lg text-zinc-300 leading-relaxed text-center">
            אם היית יכול לוותר על הפעולה הזו, היית נותן אותה לאיזה שכיר בכמה שקלים וחוסך את הכאב ראש הזה.
          </p>
        </FadeIn>
      </section>

      {/* VISION */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <div className="relative bg-gradient-to-br from-sky-950/60 via-zinc-900 to-emerald-950/60 border border-sky-500/20 rounded-3xl p-10 md:p-14 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
            <div className="relative">
              <p className="text-lg md:text-xl text-zinc-300 mb-5 leading-relaxed">
                ומה אם היית יכול להיות חופשי, ולא להיות תלוי במחשב?
              </p>
              <p className="text-lg md:text-xl text-zinc-300 mb-5 leading-relaxed">
                להעלות קריאייטיבים בהודעת ווצאפ. מכל מקום. כאילו אתה שולח הודעה לעובד שלך.
              </p>
              <p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed">
                שולח לו את הסרטון, אומר לאן להעלות, וזה באוויר.
              </p>

              <p className="text-4xl md:text-5xl font-black text-center mb-3">
                <span className="bg-gradient-to-l from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  כמו קסם.
                </span>
              </p>
              <p className="text-lg text-zinc-400 text-center italic">חלום, אה?</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* SOLUTION */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">אז הנה זה כאן.</h2>
          <p className="text-2xl md:text-3xl font-black text-emerald-400 text-center mb-10">
            תכיר את העובד החדש שלך.
          </p>
          <p className="text-lg text-zinc-300 text-center max-w-2xl mx-auto mb-14 leading-relaxed">
            Adigo עוזרת לך בדיוק עם הקסם הזה. אתה כבר לא צריך לפתוח מחשב במיוחד.
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="space-y-4 mb-12">
            <SolutionRow text="לא צריך לפתוח מחשב במיוחד" />
            <SolutionRow text="לא צריך לחכות שמטא תעבד את הסרטון" />
            <SolutionRow text="לא צריך לפתוח מודעה אחר מודעה ולשנות שם ו-UTM" />
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <p className="text-xl font-bold">והיופי?</p>
            </div>
            <p className="text-lg text-zinc-200 leading-relaxed">
              לא צריך לוודא שהוא ביצע את המשימה. זה קורה באותו הרגע.
            </p>
          </div>
        </FadeIn>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">איך זה קורה בפועל?</h2>
          <p className="text-zinc-400 text-center mb-14 text-lg">3 צעדים. 90 שניות.</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5" dir="rtl">
          <FadeIn delay={0}>
            <StepCard number={1} title="חבר WhatsApp" desc="כמו WhatsApp Web, 30 שניות" />
          </FadeIn>
          <FadeIn delay={120}>
            <StepCard number={2} title="חבר חשבון מודעות" desc="קליק אחד וזה מחובר" />
          </FadeIn>
          <FadeIn delay={240}>
            <StepCard number={3} title="שלח לקמפיינר שלך" desc="תמונה או סרטון, הוא יודע מה לעשות" />
          </FadeIn>
        </div>

        <FadeIn delay={300} className="flex justify-center mt-14">
          <GoogleButton size="lg" loading={loading} onClick={signIn} />
        </FadeIn>
      </section>

      {/* ROI / PRICING */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center">כמה זה שווה לך?</h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-7 text-lg text-zinc-300 leading-relaxed">
          <p>
            העלאה פעם בשבוע של 10 מודעות = <span className="text-white font-bold">שעה</span>.
            <br />
            4 שעות בחודש. וגם זה במקרה הטוב, אם אתה עובד רק עם לקוח אחד.
          </p>

          <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-3xl p-8 text-center">
            <p className="text-zinc-400 mb-2">עם Adigo, בממוצע</p>
            <p className="text-4xl md:text-5xl font-black mb-2">
              <span className="text-emerald-400">30 עד 60 שניות</span>
            </p>
            <p className="text-zinc-300">והקריאייטיב באוויר</p>
          </div>

          <p>
            זה לא מחליף מעבר על הנתונים ואופטימיזציה, אבל חוסך בממוצע שעות על גבי שעות. יגדיל את כמות
            הקריאייטיבים שתעלה וישפר ביצועים דרמטית.
          </p>

          <p className="text-xl md:text-2xl font-black text-white text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl py-6 px-4">
            יותר מודעות = יותר טסטים
            <br />
            = יותר מודעות מנצחות
            <br />
            <span className="text-emerald-400">= עלויות זולות בפער.</span>
          </p>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <p>3 שעות שחסכת בחודש, תדמית טובה ללקוח, ביצועים יותר טובים.</p>
            <p>לפחות עוד לקוח או שניים בפייפליין שלך.</p>
            <p className="text-2xl md:text-3xl font-black pt-3">
              זה לבד שווה לך <span className="text-emerald-400">בערך 6,000₪</span>.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-14 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 md:p-10 text-center">
            <p className="text-zinc-400 mb-2 text-lg">עלות העובד החדש שלך:</p>
            <p className="text-5xl md:text-6xl font-black mb-2">
              99₪ <span className="text-xl text-zinc-400 font-normal">לחודש</span>
            </p>
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mb-3">
              אבל את זה, אתה ממש לא הולך לשלם היום.
            </p>
            <p className="text-zinc-400 mb-2">קודם אנחנו רוצים שתרגיש כמה זה משמעותי בשבילך.</p>
            <p className="text-2xl font-black mb-8">7 ימי ניסיון. בחינם לגמרי.</p>
            <GoogleButton size="lg" loading={loading} onClick={signIn} label="אני רוצה לנסות" />
            <p className="text-xs text-zinc-500 mt-3" dir="rtl">ביטול בכל עת, בלי קנס</p>
          </div>
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">שאלות נפוצות</h2>
        </FadeIn>

        <div className="space-y-3">
          <FadeIn delay={0}>
            <FaqItem question="זה מאובטח להעלות ככה מודעות?">
              <p>
                כן, חד משמעית. המודעות לא ידלקו לבד, אתה צריך לאשר אותן.
              </p>
              <p className="mt-3">
                אחרי שאתה בטוח ומבין מה אתה עושה, ניתן גם להפעיל אותן ישירות מתוך שיחת הווצאפ.
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={80}>
            <FaqItem question="אני מנהל סוכנות, זה מתאים לי?">
              <p>
                כל מנוי = חשבון אחד. אם אתה מנהל סוכנות ורוצה חיבור לכמה לקוחות, כתוב לנו בווצאפ
                לתוכנית מותאמת.
              </p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={160}>
            <FaqItem question="מה קורה אחרי 7 הימים?">
              <p>
                אם לא ביטלת, המנוי הופך אוטומטית ל-99₪ לחודש. אפשר לבטל בכל רגע בלי קנס.
              </p>
            </FaqItem>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
            אני רוצה להעלות מודעה
            <br />
            מהווצאפ{' '}
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              בעוד 3 דקות
            </span>{' '}
            מעכשיו.
          </h2>
        </FadeIn>

        <FadeIn delay={150} className="flex flex-col items-center gap-3 mt-12">
          <GoogleButton size="lg" loading={loading} onClick={signIn} label="כן, בוא נתחיל" />
          <p className="text-xs text-zinc-500" dir="rtl">7 ימי ניסיון בחינם, בלי התחייבות</p>
        </FadeIn>
      </section>

      {/* Footer */}
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

      {/* Bottom spacer so sticky CTA doesn't cover the final button */}
      <div className="h-16" />
    </div>
  )
}

function GoogleButton({
  loading,
  onClick,
  size = 'md',
  label = 'התחל ניסיון חינם',
}: {
  loading: 'google' | null
  onClick: () => void
  size?: 'md' | 'lg'
  label?: string
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading !== null}
      className={`bg-emerald-500 hover:bg-emerald-400 text-white font-bold border-0 shadow-lg shadow-emerald-500/20 ${
        size === 'lg' ? 'h-14 text-base px-10' : 'h-11 text-sm px-6'
      }`}
    >
      {loading === 'google' ? (
        <span className="animate-spin">⟳</span>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {label}
          <ArrowLeft className="w-4 h-4 mr-1" />
        </>
      )}
    </Button>
  )
}

function StickyHeader({ visible, loading, signIn }: { visible: boolean; loading: 'google' | null; signIn: () => void }) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image src="/adigo-icon.png" alt="Adigo" width={28} height={28} className="rounded-full" />
          <span className="text-lg font-black">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>
        <GoogleButton loading={loading} onClick={signIn} />
      </div>
    </div>
  )
}

function PainRow({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-11 h-11 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mt-0.5">
        <Icon className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-zinc-300 pt-2 leading-relaxed">{text}</p>
    </div>
  )
}

function SolutionRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-colors">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <Check className="w-5 h-5 text-emerald-400" />
      </div>
      <p className="text-lg text-zinc-200">{text}</p>
    </div>
  )
}

function StepCard({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-7 text-center hover:border-emerald-500/40 transition-colors h-full">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400 font-black text-2xl">
        {number}
      </div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="bg-zinc-900/60 border border-zinc-800 rounded-2xl group open:border-zinc-700 transition-colors">
      <summary className="cursor-pointer p-6 flex items-center justify-between gap-4 font-bold text-lg list-none">
        <span>{question}</span>
        <ChevronDown className="w-5 h-5 text-zinc-500 transition-transform group-open:rotate-180 shrink-0" />
      </summary>
      <div className="px-6 pb-6 text-zinc-300 leading-relaxed border-t border-zinc-800 pt-5">{children}</div>
    </details>
  )
}
