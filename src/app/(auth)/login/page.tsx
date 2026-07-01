'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { trackCustom } from '@/components/meta-pixel'
import { FadeIn } from '@/components/landing/fade-in'
import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'
import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  ChevronDown,
  Clock,
  Coffee,
  Download,
  Globe,
  Layers,
  Lock,
  Mic2,
  Sparkles,
  Tag,
  Volume2,
  VolumeX,
  Wand2,
  Waves,
} from 'lucide-react'

const T = {
  en: {
    hero_line_1: 'Creative is king.',
    hero_line_2: 'But you?',
    hero_bottleneck: "You're its bottleneck.",
    hero_sub_1: 'Ship paid creatives from your WhatsApp.',
    hero_sub_2: 'In 30 seconds. From anywhere. Without opening Ads Manager.',
    hero_cta_helper: 'Takes 2 minutes to get set up',
    hero_trial_badge: '7-day free trial',
    trust_ssl: 'SSL encrypted',
    trust_founded: 'Built by a media buyer, for media buyers',
    demo_h2: 'What it looks like in practice',
    demo_sub_1: (arrow: string) =>
      `You send a video or image to your ${arrow}"new employee"${arrow} on WhatsApp.`,
    demo_sub_2_a: 'Tell it which campaign and ad set. That’s it.',
    demo_sub_2_b: 'It’s live.',
    pain_h2: 'Let’s put it on the table.',
    pain_p1: 'Creative diversity is the biggest lever in paid social right now.',
    pain_p2: 'You might be a killer strategist. You might drill your clients on why they need more assets.',
    pain_p3_prefix: 'But when the creatives actually land in your inbox —',
    pain_p3_bold: 'you don’t have the energy.',
    pain_p3_end: '',
    pain_intro: 'Any way you slice it, it’s',
    pain_grunt: 'grunt work',
    pain_row_transfer: 'Transfer creatives at full resolution',
    pain_row_open: 'Create every single ad, one by one, in every ad set',
    pain_row_wait: 'Upload each creative and wait for Meta to process',
    pain_row_name: 'Name every ad and set UTMs one by one',
    pain_outro: 'If you could skip it, you’d delegate this to an intern for cheap and never look back.',
    vision_p1: 'What if you weren’t chained to your laptop?',
    vision_p2: 'What if pushing a creative was just a WhatsApp message — from anywhere — like pinging your employee?',
    vision_p3: 'Send the video, tell them where to push it, done.',
    vision_magic: 'Like magic.',
    vision_dream: 'Dream, right?',
    solution_h2: 'Well, here it is.',
    solution_h3: 'Meet your new employee.',
    solution_intro: 'Adigo runs that exact play. No laptop required.',
    solution_row_1: 'No opening the laptop',
    solution_row_2: 'No waiting for Meta to process',
    solution_row_3: 'No renaming ads and hand-adjusting UTMs',
    solution_and: 'And the best part?',
    solution_final: 'You don’t have to verify it happened. It happens instantly.',
    how_h2: 'How it actually works',
    how_sub: '3 steps. 90 seconds.',
    step1_title: 'Connect WhatsApp',
    step1_desc: 'Just like WhatsApp Web. 30 seconds.',
    step2_title: 'Connect your ad account',
    step2_desc: 'One click. Done.',
    step3_title: 'Message your new employee',
    step3_desc: 'Image or video — it knows what to do.',
    scenes_h2: 'This week. Media buyers. Pushed ads from —',
    scenes_sub: 'Everywhere is Ads Manager now.',
    scene1_title: 'Mid-webinar with clients',
    scene1_text: 'Screen-recorded a clip, sent it to their new employee — live in the coaching campaign in under a minute.',
    scene2_title: 'In line for coffee',
    scene2_text: 'A new video landed from a client. By the time the coffee arrived, the ad was already running.',
    scene3_title: 'On the walk to their car',
    scene3_text: 'A client Story caught their eye. Downloaded, forwarded to the new employee — live before they hit the exit.',
    scene4_title: 'At the beach, under an umbrella',
    scene4_text: 'Client sent same-day shoot footage, urgent. Feet stayed in the sand.',
    roi_h2: 'What is it actually worth?',
    roi_p1_a: 'One weekly upload of 10 ads =',
    roi_p1_b: '1 hour.',
    roi_p1_c: '4 hours a month. And that’s optimistic — if you only work with one client.',
    roi_with_adigo: 'With Adigo, on average',
    roi_time: '30 to 60 seconds',
    roi_and_live: 'and the creative is live',
    roi_p2: 'This doesn’t replace looking at data or optimizing. But it saves hours upon hours. You’ll push more creatives, and performance jumps because of it.',
    roi_formula_a: 'More ads = more tests',
    roi_formula_b: '= more winners',
    roi_formula_c: '= drastically lower costs.',
    roi_p3_a: '3 hours saved every month, a sharper client image, better results.',
    roi_p3_b: 'At least one or two more clients in your pipeline.',
    roi_p3_c_a: 'That alone is worth about',
    roi_p3_c_b: '$1,500 a month.',
    price_prefix: 'Cost of your new employee:',
    price_amount: '₪99',
    price_period: '/month',
    price_but: 'You’re not paying that today.',
    price_first: 'First we want you to feel how much this changes your workflow.',
    price_trial: '7-day trial. Completely free.',
    price_cta: 'I want to try',
    price_cancel: 'Cancel any time. One click.',
    faq_h2: 'FAQ',
    faq1_q: 'Is this actually secure?',
    faq1_a1: 'Yes. Ads don’t go live on their own — you approve every one.',
    faq1_a2: 'Once you’re comfortable, you can also launch them straight from the WhatsApp thread.',
    faq2_q: 'I run an agency. Does this fit?',
    faq2_a: 'Each seat = one ad account. If you’re running an agency and need multiple client accounts, ping us on WhatsApp for an agency plan.',
    faq3_q: 'What happens after 7 days?',
    faq3_a: 'If you don’t cancel, the subscription rolls into ₪99/month. Cancel any time with one click.',
    final_line_1: 'I want to launch an ad from WhatsApp',
    final_line_2: 'in the next 3 minutes',
    final_line_3: 'from now.',
    final_cta: 'Let’s go',
    final_helper: '7-day free trial. No commitment.',
    footer_tagline: 'Built for media buyers, by a media buyer.',
    footer_support: 'Support:',
    google_start: 'Start free trial',
    signin_error: 'Sign-in failed. Try again.',
    sound_on: 'Unmute',
    sound_off: 'Mute',
  },
  he: {
    hero_line_1: 'הקריאייטיב הוא המלך.',
    hero_line_2: 'אבל אתה?',
    hero_bottleneck: 'צוואר הבקבוק שלו.',
    hero_sub_1: 'תתחיל להעלות מודעות לממומן מהווצאפ.',
    hero_sub_2: 'תוך 30 שניות. מכל מקום. בלי לפתוח מנהל מודעות.',
    hero_cta_helper: 'לוקח לך 2 דקות להתחיל',
    hero_trial_badge: '7 ימי ניסיון בחינם',
    trust_ssl: 'SSL מוצפן',
    trust_founded: 'חברה ישראלית, תמיכה בעברית',
    demo_h2: 'ככה זה נראה בפועל',
    demo_sub_1: (q: string) => `שלחת סרטון או תמונה לווצאפ של ${q}העובד החדש שלך${q}.`,
    demo_sub_2_a: 'אמרת לו לאיזה קמפיין וסדרת מודעות להעלות. זהו.',
    demo_sub_2_b: 'זה באוויר.',
    pain_h2: 'בוא נשים את הדברים על השולחן.',
    pain_p1: 'גיוון בקריאייטיב היום הוא דרמטי.',
    pain_p2: 'יכול להיות שאתה אסטרטג על וסופר מקצוען, ואפילו חופר ללקוח שלך על כמה חשוב לייצר עוד תכנים.',
    pain_p3_prefix: 'אבל ברגע האמת שהקריאייטיבים הגיעו, ',
    pain_p3_bold: 'אין לך כוח',
    pain_p3_end: '.',
    pain_intro: 'לא משנה איך תסובב את זה, זאת',
    pain_grunt: 'עבודה שחורה',
    pain_row_transfer: 'להעביר את הקריאייטיבים באיכות גבוהה',
    pain_row_open: 'לפתוח כל מודעה בנפרד בכל סדרת מודעות',
    pain_row_wait: 'להעלות את הקריאייטיב לחשבון מודעות ולחכות עד שמטא תעבד אותו',
    pain_row_name: 'לתת שם שונה לכל מודעה ולהתאים את ה-UTM בכל אחת מהמודעות',
    pain_outro: 'אם היית יכול לוותר על הפעולה הזו, היית נותן אותה לאיזה שכיר בכמה שקלים וחוסך את הכאב ראש הזה.',
    vision_p1: 'ומה אם היית יכול להיות חופשי, ולא להיות תלוי במחשב?',
    vision_p2: 'להעלות קריאייטיבים בהודעת ווצאפ. מכל מקום. כאילו אתה שולח הודעה לעובד שלך.',
    vision_p3: 'שולח לו את הסרטון, אומר לאן להעלות, וזה באוויר.',
    vision_magic: 'כמו קסם.',
    vision_dream: 'חלום, אה?',
    solution_h2: 'אז הנה זה כאן.',
    solution_h3: 'תכיר את העובד החדש שלך.',
    solution_intro: 'Adigo עוזרת לך בדיוק עם הקסם הזה. אתה כבר לא צריך לפתוח מחשב במיוחד.',
    solution_row_1: 'לא צריך לפתוח מחשב במיוחד',
    solution_row_2: 'לא צריך לחכות שמטא תעבד את הסרטון',
    solution_row_3: 'לא צריך לפתוח מודעה אחר מודעה ולשנות שם ו-UTM',
    solution_and: 'והיופי?',
    solution_final: 'לא צריך לוודא שהוא ביצע את המשימה. זה קורה באותו הרגע.',
    how_h2: 'איך זה קורה בפועל?',
    how_sub: '3 צעדים. 90 שניות.',
    step1_title: 'חבר ווצאפ',
    step1_desc: 'כמו ווצאפ ווב, 30 שניות',
    step2_title: 'חבר חשבון מודעות',
    step2_desc: 'קליק אחד וזה מחובר',
    step3_title: 'שלח ווצאפ לעובד החדש שלך',
    step3_desc: 'תמונה או סרטון, הוא יודע מה לעשות',
    scenes_h2: 'השבוע. קמפיינרים. העלו מודעות מ־',
    scenes_sub: 'כל מקום הוא Ads Manager עכשיו.',
    scene1_title: 'באמצע וובינר ללקוחות',
    scene1_text: 'צילמו סרטון מהמסך, שלחו לעובד החדש — בקמפיין הליווי תוך דקה.',
    scene2_title: 'בתור לקפה',
    scene2_text: 'סרטון חדש הגיע מהלקוח בווצאפ. עד שהקפה הגיע, המודעה הייתה באוויר.',
    scene3_title: 'בדרך לחניון',
    scene3_text: 'סטורי של לקוח עף בפיד. הורידו, העבירו לעובד החדש — באוויר לפני שיצאו.',
    scene4_title: 'בים, על שמשייה',
    scene4_text: 'הלקוח שלח סרטונים מצילום של היום, לחוץ שיעלו. הרגליים נשארו בחול.',
    roi_h2: 'כמה זה שווה לך?',
    roi_p1_a: 'העלאה פעם בשבוע של 10 מודעות =',
    roi_p1_b: 'שעה.',
    roi_p1_c: '4 שעות בחודש. וגם זה במקרה הטוב, אם אתה עובד רק עם לקוח אחד.',
    roi_with_adigo: 'עם Adigo, בממוצע',
    roi_time: '30 עד 60 שניות',
    roi_and_live: 'והקריאייטיב באוויר',
    roi_p2: 'זה לא מחליף מעבר על הנתונים ואופטימיזציה, אבל חוסך בממוצע שעות על גבי שעות. יגדיל את כמות הקריאייטיבים שתעלה וישפר ביצועים דרמטית.',
    roi_formula_a: 'יותר מודעות = יותר טסטים',
    roi_formula_b: '= יותר מודעות מנצחות',
    roi_formula_c: '= עלויות זולות בפער.',
    roi_p3_a: '3 שעות שחסכת בחודש, תדמית טובה ללקוח, ביצועים יותר טובים.',
    roi_p3_b: 'לפחות עוד לקוח או שניים בפייפליין שלך.',
    roi_p3_c_a: 'זה לבד שווה לך',
    roi_p3_c_b: 'בערך 6,000₪.',
    price_prefix: 'עלות העובד החדש שלך:',
    price_amount: '99₪',
    price_period: 'לחודש',
    price_but: 'אבל את זה, אתה ממש לא הולך לשלם היום.',
    price_first: 'קודם אנחנו רוצים שתרגיש כמה זה משמעותי בשבילך.',
    price_trial: '7 ימי ניסיון. בחינם לגמרי.',
    price_cta: 'אני רוצה לנסות',
    price_cancel: 'ביטול בכל עת, בלחיצת כפתור',
    faq_h2: 'שאלות נפוצות',
    faq1_q: 'זה מאובטח להעלות ככה מודעות?',
    faq1_a1: 'כן, חד משמעית. המודעות לא ידלקו לבד, אתה צריך לאשר אותן.',
    faq1_a2: 'אחרי שאתה בטוח ומבין מה אתה עושה, ניתן גם להפעיל אותן ישירות מתוך שיחת הווצאפ.',
    faq2_q: 'אני מנהל סוכנות, זה מתאים לי?',
    faq2_a: 'כל מנוי = חשבון אחד. אם אתה מנהל סוכנות ורוצה חיבור לכמה לקוחות, כתוב לנו בווצאפ לתוכנית מותאמת.',
    faq3_q: 'מה קורה אחרי 7 הימים?',
    faq3_a: 'אם לא ביטלת, המנוי הופך אוטומטית ל-99₪ לחודש. אפשר לבטל בכל רגע בלחיצת כפתור.',
    final_line_1: 'אני רוצה להעלות מודעה',
    final_line_2: 'מהווצאפ בעוד 3 דקות',
    final_line_3: 'מעכשיו.',
    final_cta: 'כן, בוא נתחיל',
    final_helper: '7 ימי ניסיון בחינם, בלי התחייבות',
    footer_tagline: 'בנוי לקמפיינרים, ע״י קמפיינר.',
    footer_support: 'תמיכה:',
    google_start: 'התחל ניסיון חינם',
    signin_error: 'שגיאה בהתחברות, נסה שוב',
    sound_on: 'הפעל קול',
    sound_off: 'השתק',
  },
} as const

export default function LoginPage() {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]
  const isEn = locale === 'en'
  const ArrowCta = isEn ? ArrowRight : ArrowLeft
  const quoteMark = isEn ? '“' : '״'

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
      options: { redirectTo: `${window.location.origin}/api/auth/callback?locale=${locale}` },
    })
    if (error) {
      toast.error(t.signin_error)
      setLoading(null)
    }
  }

  return (
    <div className="bg-zinc-950 text-white" dir={dir}>
      <StickyHeader visible={stickyVisible} loading={loading} signIn={signIn} label={t.google_start} arrow={ArrowCta} />

      {/* HERO */}
      <section className="px-6 pt-16 pb-16 max-w-5xl mx-auto">
        <FadeIn className="flex items-center justify-center gap-3 mb-10">
          <Image src="/adigo-icon.png" alt="Adigo" width={60} height={60} className="rounded-full" priority />
          <span className="text-3xl font-black" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </span>
        </FadeIn>

        <FadeIn delay={100}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center leading-[1.15] mb-8">
            {t.hero_line_1}
            <br />
            {t.hero_line_2}{' '}
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              {t.hero_bottleneck}
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={250}>
          <p className="text-lg md:text-2xl text-zinc-300 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            {t.hero_sub_1}
            <br />
            <span className="text-white font-bold">{t.hero_sub_2}</span>
          </p>
        </FadeIn>

        <FadeIn delay={400} className="flex flex-col items-center gap-3 mb-10">
          <GoogleButton size="lg" loading={loading} onClick={signIn} label={t.google_start} arrow={ArrowCta} />
          <p className="text-xs text-zinc-500" dir={dir}>{t.hero_cta_helper}</p>
        </FadeIn>

        <FadeIn delay={500} className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 font-bold text-sm">{t.hero_trial_badge}</span>
          </div>
        </FadeIn>
      </section>

      {/* TRUST BAR */}
      <FadeIn>
        <section className="bg-zinc-900/40 border-y border-zinc-800 py-5">
          <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-zinc-400">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t.trust_ssl}
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t.trust_founded}
            </span>
          </div>
        </section>
      </FadeIn>

      {/* DEMO VIDEO */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">{t.demo_h2}</h2>
          <p className="text-zinc-300 text-center mb-2 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {isEn ? (
              <>You send a video or image to your <span className="text-white font-bold">{quoteMark}new employee{quoteMark}</span> on WhatsApp.</>
            ) : (
              <>שלחת סרטון או תמונה לווצאפ של <span className="text-white font-bold">{quoteMark}העובד החדש שלך{quoteMark}</span>.</>
            )}
          </p>
          <p className="text-zinc-300 text-center mb-12 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            {t.demo_sub_2_a}{' '}
            <span className="text-emerald-400 font-bold">{t.demo_sub_2_b}</span>
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <DemoVideo soundOnLabel={t.sound_on} soundOffLabel={t.sound_off} />
        </FadeIn>
      </section>

      {/* PAIN */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
            {t.pain_h2}
          </h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-6 text-lg text-zinc-300 leading-relaxed">
          <p>{t.pain_p1}</p>
          <p>{t.pain_p2}</p>
          <p className="text-2xl font-black text-white">
            {t.pain_p3_prefix}
            <span className="underline decoration-red-500 decoration-[5px] underline-offset-[2px]">
              {t.pain_p3_bold}
            </span>
            {t.pain_p3_end}
          </p>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-14 bg-gradient-to-br from-zinc-900 to-zinc-900/40 border border-zinc-800 rounded-3xl p-8 md:p-10">
            <p className="text-lg text-zinc-300 mb-8 leading-relaxed">
              {t.pain_intro}{' '}
              <span className="text-red-400 font-bold">{t.pain_grunt}</span>:
            </p>

            <div className="space-y-5">
              <PainRow icon={Download} text={t.pain_row_transfer} />
              <PainRow icon={Layers} text={t.pain_row_open} />
              <PainRow icon={Clock} text={t.pain_row_wait} />
              <PainRow icon={Tag} text={t.pain_row_name} />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="mt-10 text-lg text-zinc-300 leading-relaxed text-center">
            {t.pain_outro}
          </p>
        </FadeIn>
      </section>

      {/* VISION */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <div className="relative bg-gradient-to-br from-sky-950/60 via-zinc-900 to-emerald-950/60 border border-sky-500/20 rounded-3xl p-10 md:p-14 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.15),transparent_50%)]" />
            <div className="relative">
              <p className="text-lg md:text-xl text-zinc-300 mb-5 leading-relaxed">{t.vision_p1}</p>
              <p className="text-lg md:text-xl text-zinc-300 mb-5 leading-relaxed">{t.vision_p2}</p>
              <p className="text-lg md:text-xl text-zinc-300 mb-10 leading-relaxed">{t.vision_p3}</p>

              <p className="text-4xl md:text-5xl font-black text-center mb-3">
                <span className="bg-gradient-to-l from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                  {t.vision_magic}
                </span>
              </p>
              <p className="text-lg text-zinc-400 text-center italic">{t.vision_dream}</p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* SOLUTION */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">{t.solution_h2}</h2>
          <p className="text-2xl md:text-3xl font-black text-emerald-400 text-center mb-10">
            {t.solution_h3}
          </p>
          <p className="text-lg text-zinc-300 text-center max-w-2xl mx-auto mb-14 leading-relaxed">
            {t.solution_intro}
          </p>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="space-y-4 mb-12">
            <SolutionRow text={t.solution_row_1} />
            <SolutionRow text={t.solution_row_2} />
            <SolutionRow text={t.solution_row_3} />
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 rounded-2xl p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <Wand2 className="w-5 h-5 text-emerald-400" />
              <p className="text-xl font-bold">{t.solution_and}</p>
            </div>
            <p className="text-lg text-zinc-200 leading-relaxed">{t.solution_final}</p>
          </div>
        </FadeIn>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">{t.how_h2}</h2>
          <p className="text-zinc-400 text-center mb-14 text-lg">{t.how_sub}</p>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-5" dir={dir}>
          <FadeIn delay={0}>
            <StepCard number={1} title={t.step1_title} desc={t.step1_desc} dir={dir} />
          </FadeIn>
          <FadeIn delay={120}>
            <StepCard number={2} title={t.step2_title} desc={t.step2_desc} dir={dir} />
          </FadeIn>
          <FadeIn delay={240}>
            <StepCard number={3} title={t.step3_title} desc={t.step3_desc} dir={dir} />
          </FadeIn>
        </div>

        <FadeIn delay={300} className="flex justify-center mt-14">
          <GoogleButton size="lg" loading={loading} onClick={signIn} label={t.google_start} arrow={ArrowCta} />
        </FadeIn>
      </section>

      {/* SCENES */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center leading-tight">
            {t.scenes_h2}
          </h2>
          <p className="text-zinc-400 text-center mb-12 text-lg">
            {t.scenes_sub}
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-4">
          <FadeIn delay={0}>
            <SceneCard icon={Mic2} title={t.scene1_title} text={t.scene1_text} dir={dir} />
          </FadeIn>
          <FadeIn delay={120}>
            <SceneCard icon={Coffee} title={t.scene2_title} text={t.scene2_text} dir={dir} />
          </FadeIn>
          <FadeIn delay={240}>
            <SceneCard icon={Car} title={t.scene3_title} text={t.scene3_text} dir={dir} />
          </FadeIn>
          <FadeIn delay={360}>
            <SceneCard icon={Waves} title={t.scene4_title} text={t.scene4_text} dir={dir} />
          </FadeIn>
        </div>
      </section>

      {/* ROI / PRICING */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-14 text-center">{t.roi_h2}</h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-7 text-lg text-zinc-300 leading-relaxed">
          <p>
            {t.roi_p1_a} <span className="text-white font-bold">{t.roi_p1_b}</span>
            <br />
            {t.roi_p1_c}
          </p>

          <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/30 rounded-3xl p-8 text-center">
            <p className="text-zinc-400 mb-2">{t.roi_with_adigo}</p>
            <p className="text-4xl md:text-5xl font-black mb-2">
              <span className="text-emerald-400">{t.roi_time}</span>
            </p>
            <p className="text-zinc-300">{t.roi_and_live}</p>
          </div>

          <p>{t.roi_p2}</p>

          <p className="text-xl md:text-2xl font-black text-white text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl py-6 px-4">
            {t.roi_formula_a}
            <br />
            {t.roi_formula_b}
            <br />
            <span className="text-emerald-400">{t.roi_formula_c}</span>
          </p>

          <div className="pt-4 border-t border-zinc-800 space-y-3">
            <p>{t.roi_p3_a}</p>
            <p>{t.roi_p3_b}</p>
            <p className="text-2xl md:text-3xl font-black pt-3">
              {t.roi_p3_c_a} <span className="text-emerald-400">{t.roi_p3_c_b}</span>
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div className="mt-14 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 md:p-10 text-center">
            <p className="text-zinc-400 mb-2 text-lg">{t.price_prefix}</p>
            <p className="text-5xl md:text-6xl font-black mb-2">
              {t.price_amount} <span className="text-xl text-zinc-400 font-normal">{t.price_period}</span>
            </p>
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
            <p className="text-xl md:text-2xl font-bold text-emerald-400 mb-3">
              {t.price_but}
            </p>
            <p className="text-zinc-400 mb-2">{t.price_first}</p>
            <p className="text-2xl font-black mb-8">{t.price_trial}</p>
            <GoogleButton size="lg" loading={loading} onClick={signIn} label={t.price_cta} arrow={ArrowCta} />
            <p className="text-xs text-zinc-500 mt-3" dir={dir}>{t.price_cancel}</p>
          </div>
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{t.faq_h2}</h2>
        </FadeIn>

        <div className="space-y-3">
          <FadeIn delay={0}>
            <FaqItem question={t.faq1_q}>
              <p>{t.faq1_a1}</p>
              <p className="mt-3">{t.faq1_a2}</p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={80}>
            <FaqItem question={t.faq2_q}>
              <p>{t.faq2_a}</p>
            </FaqItem>
          </FadeIn>

          <FadeIn delay={160}>
            <FaqItem question={t.faq3_q}>
              <p>{t.faq3_a}</p>
            </FaqItem>
          </FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-24 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
            {t.final_line_1}
            <br />
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              {t.final_line_2}
            </span>{' '}
            {t.final_line_3}
          </h2>
        </FadeIn>

        <FadeIn delay={150} className="flex flex-col items-center gap-3 mt-12">
          <GoogleButton size="lg" loading={loading} onClick={signIn} label={t.final_cta} arrow={ArrowCta} />
          <p className="text-xs text-zinc-500" dir={dir}>{t.final_helper}</p>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-10 text-center text-sm text-zinc-500 px-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image src="/adigo-icon.png" alt="Adigo" width={28} height={28} className="rounded-full" />
          <span className="font-black" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>
        <p>{t.footer_tagline}</p>
        <p className="mt-2">
          {t.footer_support}{' '}
          <a href="https://wa.me/972526660006" className="text-zinc-400 hover:text-white" dir="ltr">
            +972-52-666-0006
          </a>
        </p>
      </footer>

      <div className="h-16" />
    </div>
  )
}

function GoogleButton({
  loading,
  onClick,
  size = 'md',
  label,
  arrow: ArrowIcon,
}: {
  loading: 'google' | null
  onClick: () => void
  size?: 'md' | 'lg'
  label: string
  arrow: React.ComponentType<{ className?: string }>
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
          <ArrowIcon className="w-4 h-4 mx-1" />
        </>
      )}
    </Button>
  )
}

function StickyHeader({
  visible, loading, signIn, label, arrow,
}: {
  visible: boolean
  loading: 'google' | null
  signIn: () => void
  label: string
  arrow: React.ComponentType<{ className?: string }>
}) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Image src="/adigo-icon.png" alt="Adigo" width={28} height={28} className="rounded-full" />
          <span className="text-lg font-black" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </span>
        </div>
        <GoogleButton loading={loading} onClick={signIn} label={label} arrow={arrow} />
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

function StepCard({
  number, title, desc, dir,
}: { number: number; title: string; desc: string; dir: 'ltr' | 'rtl' }) {
  return (
    <div dir={dir} className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-3xl p-7 text-center hover:border-emerald-500/40 transition-colors h-full">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5 text-emerald-400 font-black text-2xl">
        {number}
      </div>
      <h3 dir={dir} className="font-bold text-lg mb-2">{title}</h3>
      <p dir={dir} className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function DemoVideo({ soundOnLabel, soundOffLabel }: { soundOnLabel: string; soundOffLabel: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onTime = () => {
      if (v.duration > 0) setProgress((v.currentTime / v.duration) * 100)
    }
    v.addEventListener('timeupdate', onTime)
    return () => v.removeEventListener('timeupdate', onTime)
  }, [])

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    if (v.paused) v.play().catch(() => {})
  }

  return (
    <div className="flex justify-center">
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/adigo-icon.png"
          className="w-[90vw] md:w-auto md:h-[60vh] rounded-3xl border border-zinc-800 shadow-2xl shadow-emerald-500/10 block bg-zinc-900"
        >
          <source src="/adigo-demo.mp4" type="video/mp4" />
        </video>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? soundOnLabel : soundOffLabel}
          className="absolute top-4 left-4 flex items-center gap-2 bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 rounded-full px-4 py-2 text-white text-sm font-bold shadow-lg transition-colors"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? soundOnLabel : soundOffLabel}</span>
        </button>

        <div className="absolute bottom-3 left-4 right-4 h-1 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-emerald-400 to-sky-400"
            style={{ width: `${progress}%`, transition: 'width 200ms linear' }}
          />
        </div>
      </div>
    </div>
  )
}

function SceneCard({
  icon: Icon, title, text, dir,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  text: string
  dir: 'ltr' | 'rtl'
}) {
  return (
    <div
      dir={dir}
      className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/30 transition-colors h-full"
    >
      <div className="shrink-0 w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
        <Icon className="w-5 h-5 text-sky-400" />
      </div>
      <div>
        <p className="text-white font-bold mb-1">{title}</p>
        <p className="text-zinc-300 leading-relaxed">{text}</p>
      </div>
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
