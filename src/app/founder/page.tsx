'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FadeIn } from '@/components/landing/fade-in'
import { useLocale, useApplyHtmlDir, dirFor } from '@/lib/locale'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Code2,
  GitBranch,
  Infinity as InfinityIcon,
  PlayCircle,
  Sparkles,
  Users,
  Lock,
} from 'lucide-react'

const T = {
  en: {
    badge: 'Founder Pack — 30 seats total',
    hero_line_1: 'I planned a SaaS.',
    hero_line_2: 'Now I’m giving you everything.',
    hero_sub_1: 'The full Adigo source code + the skill + recorded implementation training.',
    hero_sub_2: 'Yours forever. No subscription. No caps.',
    seats_left_prefix: 'Only',
    seats_left_bold: '23 seats',
    seats_left_suffix: 'remain out of 30',
    pivot_h2: 'Hold on. Why 250 NIS for a full codebase?',
    pivot_p1: 'I built Adigo as a monthly SaaS — ₪99 a month. Register, connect, run.',
    pivot_p2_a: 'There’s one gate I underestimated:',
    pivot_p2_b: 'Meta App Review.',
    pivot_p2_c: 'Without it I can only grant access to 100 users, each one manually approved as a tester on Facebook — a 5-10 minute process per customer. Not scalable.',
    pivot_p3: 'The review takes 4-8 weeks. I’m not willing to wait.',
    pivot_p4: 'So instead of selling access, I decided to ship everything.',
    pivot_card_1_a: '30 media buyers get',
    pivot_card_1_b: 'the full source code',
    pivot_card_1_c: 'of Adigo, the',
    pivot_card_1_d: 'skill',
    pivot_card_1_e: 'that teaches you how to run it, and',
    pivot_card_1_f: 'the implementation training',
    pivot_card_1_g: '— all self-serve, all yours.',
    pivot_card_2: 'Everything lives on your infrastructure. Basic technical background is enough to modify the code and fit it to your exact workflow.',
    included_h2: 'What’s included',
    included_sub: 'Everything. No asterisks.',
    inc1_title: 'Full source code',
    inc1_text: 'Complete GitHub repo — Next.js + Baileys server + Supabase schema. Zero hidden layers. You own the code from day one.',
    inc2_title: 'Adigo Pro skill',
    inc2_text: 'A professional Claude/ChatGPT skill: creative strategy, campaign naming conventions, daily workflow, troubleshooting.',
    inc3_title: '3 recorded training videos',
    inc3_text: '3-minute setup, daily workflow walk-through, advanced skill usage. Watch at your pace. Unlimited replays.',
    inc4_title: 'Freedom to modify',
    inc4_text: 'You own it. With basic technical skills (or an engineer you hire) you can rebrand, add features, plug it into your data stack — whatever fits.',
    inc5_title: 'Founders-only WhatsApp',
    inc5_text: '30 media buyers sharing fixes, improvements and shortcuts. Peer support that actually helps.',
    inc6_title: 'No subscription. No caps.',
    inc6_text: 'One-time payment. No "after 7 days", no upgrade tiers, no "your plan expires in X days". Yours for good.',
    math_h2: 'The math',
    math_saas: 'Planned: monthly SaaS',
    math_saas_price: '₪99 / month',
    math_saas_year: '= ₪1,188 / year',
    math_pack: 'Founder Pack',
    math_pack_price: '₪250',
    math_pack_note: 'one-time',
    math_forever: 'forever',
    math_summary_a: '₪250 once versus ₪99 every month.',
    math_summary_b: 'Payback in 3 months,',
    math_summary_c: 'and every month after is pure savings compared to a recurring SaaS bill.',
    who_h2: 'Who this fits',
    who_1: 'Freelance media buyers managing 3+ clients who are tired of grunt work',
    who_2: 'Small agencies looking to save 4-8 hours a week on uploads',
    who_3: 'Business owners running their own campaigns who don’t want to open Ads Manager 10 times a day',
    who_4: 'Anyone who prefers owning the code over renting access',
    faq_h2: 'FAQ',
    faq1_q: 'Do I need to be a developer to install?',
    faq1_a: 'No. The recorded training walks you through every step — takes ~30-45 minutes the first time. Deployment to Vercel + Supabase (both free tiers), then Meta + WhatsApp connection. If you get stuck, the founders WhatsApp will help you in minutes.',
    faq2_q: 'What if I don’t want to touch the code afterwards?',
    faq2_a: 'You don’t have to. After the initial install the system runs on its own. The code is open if you ever want to change something later, but it’s not required.',
    faq3_q: 'Will I get updates if you improve Adigo?',
    faq3_a: 'Yes. Founders get access to the updated repo for 12 months, and every improvement I ship is pushed through automatically. After that year, you keep the latest version you have and can continue updating on your own.',
    faq4_q: 'What about Meta App? Do I still need Review?',
    faq4_a: 'Not necessarily. If you’re using the system for yourself or a handful of clients you can add manually as testers, you don’t need App Review. If you want to open it to the public, you can submit Review on your own Meta app (the training includes a doc with exact instructions).',
    faq5_q: 'Is this open? Can a competitor take it and sell it?',
    faq5_a: 'The product ships under a personal license. You can use it, modify it, and sell services built on top of it — but not re-package and sell it as your own product. Full terms in the install brief.',
    final_h2: 'Want to be one of the 30?',
    final_sub: 'Drop your details and I’ll come back to you within 24 hours with the next steps and the payment link.',
    footer_tagline: 'Built for media buyers, by a media buyer.',
    footer_support: 'Support:',
    form_name_label: 'Full name',
    form_name_ph: 'e.g. John Miller',
    form_phone_label: 'Phone',
    form_phone_ph: '050-1234567',
    form_cta: 'I want to be a founder',
    form_sending: 'Sending...',
    form_helper: 'I’ll reach out on WhatsApp within 24 hours',
    form_err_generic: 'Something went wrong. Try again.',
    form_done_title: 'Got it. I’m coming back to you.',
    form_done_body: 'I’ll reach out on WhatsApp within 24 hours with the next steps and the payment link.',
  },
  he: {
    badge: 'Founder Pack — 30 מקומות בלבד',
    hero_line_1: 'תכננתי SaaS.',
    hero_line_2: 'עכשיו אני נותן לכם את הכל.',
    hero_sub_1: 'הקוד המלא של Adigo + הסקיל + הדרכת הטמעה מוקלטת.',
    hero_sub_2: 'לבעלותך לתמיד. בלי מנוי. בלי הגבלה.',
    seats_left_prefix: '',
    seats_left_bold: '23 מקומות נותרו',
    seats_left_suffix: 'מתוך 30',
    pivot_h2: 'רגע. למה לקחת קוד שלם ב-250₪?',
    pivot_p1: 'תכננתי את Adigo כשירות מנוי — 99₪ לחודש. תרשמו, תחברו, תעבדו.',
    pivot_p2_a: 'אבל יש חסם אחד שלא חשבתי עליו:',
    pivot_p2_b: 'Meta דורשים אישור App Review.',
    pivot_p2_c: 'בלי האישור — אני יכול לתת גישה ל-100 משתמשים בלבד, כל אחד צריך לאשר ידנית כ-tester בפייסבוק, וזה תהליך של 5-10 דקות לכל לקוח. לא בר־קיימא.',
    pivot_p3: 'תהליך האישור לוקח 4-8 שבועות. ואני לא רוצה לחכות.',
    pivot_p4: 'אז במקום למכור גישה, החלטתי לשתף הכל.',
    pivot_card_1_a: '30 קמפיינרים מקבלים את',
    pivot_card_1_b: 'הקוד המלא',
    pivot_card_1_c: 'של Adigo, את',
    pivot_card_1_d: 'הסקיל המקצועי',
    pivot_card_1_e: 'שמלמד איך לעבוד איתו, ואת',
    pivot_card_1_f: 'הדרכת ההטמעה',
    pivot_card_1_g: 'המוקלטת — בכל זמן שתרצו.',
    pivot_card_2: 'הכל יושב אצלך. עם ידע טכני בסיסי — אתה אפילו יכול לשפר את הקוד ולהתאים אותו לעצמך.',
    included_h2: 'מה כלול בחבילה',
    included_sub: 'הכל. בלי כוכביות.',
    inc1_title: 'כל קוד המקור',
    inc1_text: 'ריפו GitHub מלא — Next.js + Baileys server + Supabase schema. אפס שכבות מוסתרות. אתה הופך לבעלים של הקוד מהרגע הראשון.',
    inc2_title: 'סקיל Adigo Pro',
    inc2_text: 'סקיל מקצועי לעבודה עם Claude/ChatGPT — אסטרטגיית קריאייטיב, נומנקלטורת קמפיינים, workflow יומי, ופתרון תקלות.',
    inc3_title: '3 סרטוני הדרכה מוקלטים',
    inc3_text: 'התקנה ב-3 דקות, ה-workflow היומי שלי, ושימוש מתקדם בסקיל. צפייה חופשית, בקצב שלך, ללא הגבלה.',
    inc4_title: 'חופש לעדכן ולשנות',
    inc4_text: 'אתה הבעלים. עם ידע טכני בסיסי (או מפתח שאתה שוכר) — אפשר לעדכן צבעים, להוסיף פיצ׳רים, לחבר לבסיס נתונים שלך, מה שמתאים לך.',
    inc5_title: 'קבוצת ווצאפ של מייסדים',
    inc5_text: '30 קמפיינרים שמשתפים פתרונות, שיפורים, וקצרי דרך. רשת תמיכה פנים אל פנים.',
    inc6_title: 'אין מנוי. אין הגבלה.',
    inc6_text: 'עלות חד-פעמית. בלי "אחרי 7 ימים", בלי שדרוגים, בלי "המנוי שלך יסתיים בעוד 30 ימים". הקוד שלך לתמיד.',
    math_h2: 'המתמטיקה',
    math_saas: 'תוכנן: SaaS חודשי',
    math_saas_price: '99₪ / חודש',
    math_saas_year: '= 1,188₪ לשנה',
    math_pack: 'Founder Pack',
    math_pack_price: '250₪',
    math_pack_note: 'תשלום חד-פעמי',
    math_forever: 'לתמיד',
    math_summary_a: '250₪ פעם אחת לעומת 99₪ חודש אחר חודש.',
    math_summary_b: 'החזר השקעה תוך 3 חודשים,',
    math_summary_c: 'ואחרי זה — כל חודש זה רווח נקי לעומת תשלום SaaS חוזר.',
    who_h2: 'למי זה מתאים?',
    who_1: 'קמפיינרים פרילנסרים שמנהלים 3+ לקוחות ועייפים מהעבודה השחורה',
    who_2: 'סוכנויות קטנות שרוצות לחסוך 4-8 שעות בשבוע על העלאות',
    who_3: 'בעלי עסקים שמנהלים את הקמפיינים שלהם בעצמם ולא רוצים לפתוח Ads Manager 10 פעמים ביום',
    who_4: 'כל מי שמעדיף בעלות על הקוד מאשר תלות במנוי',
    faq_h2: 'שאלות נפוצות',
    faq1_q: 'צריך להיות מפתח כדי להתקין?',
    faq1_a: 'לא. ההדרכה המוקלטת מובילה אותך צעד אחר צעד — דורש בערך 30-45 דקות בפעם הראשונה. התקנה ב-Vercel + Supabase (שירותים חינמיים), חיבור Meta + WhatsApp. אם נתקעת — בקבוצת המייסדים יעזרו לך תוך דקות.',
    faq2_q: 'מה אם אני לא רוצה להתעסק עם קוד אחר כך?',
    faq2_a: 'אין צורך. אחרי ההתקנה הראשונית — המערכת רצה לבד. הקוד פתוח אם תרצה לשנות משהו בעתיד, אבל זה לא חובה.',
    faq3_q: 'האם אקבל עדכונים אם אתה משפר את Adigo?',
    faq3_a: 'כן. מייסדים מקבלים גישה ל-repo המעודכן ל-12 חודשים, וכל שיפור שאעשה מועבר אוטומטית. אחרי שנה — אתה ממשיך עם הגרסה האחרונה שיש בידך, ויכול להמשיך לעדכן בעצמך.',
    faq4_q: 'מה לגבי Meta App? עדיין צריך לעבור Review?',
    faq4_a: 'לא חובה — אם אתה משתמש במערכת רק לעצמך או לכמה לקוחות שאתה מוסיף ידנית כ-testers, אתה לא צריך App Review. אם תרצה לפתוח את זה לעוד אנשים — תוכל להגיש Review של אפליקציית Meta שלך בעצמך (ההדרכה כוללת מסמך עם הוראות מדויקות).',
    faq5_q: 'זה רעיון פתוח? יכול לבוא מתחרה ולמכור את זה?',
    faq5_a: 'המוצר נמסר עם רישיון אישי בלבד. אתה יכול להשתמש, לערוך, ולמכור שירות מבוסס עליו — אבל לא לארוז ולמכור אותו מחדש כמוצר משלך. כל הפרטים בהסכם שיועבר בקריאת ההתקנה.',
    final_h2: 'רוצה להיות אחד מ-30?',
    final_sub: 'השאר פרטים ואני אחזור אליך תוך 24 שעות עם הצעדים הבאים והקישור לתשלום.',
    footer_tagline: 'בנוי לקמפיינרים, ע״י קמפיינר.',
    footer_support: 'תמיכה:',
    form_name_label: 'שם מלא',
    form_name_ph: 'לדוגמה: יוסי לוי',
    form_phone_label: 'טלפון',
    form_phone_ph: '050-1234567',
    form_cta: 'אני רוצה להיות מייסד',
    form_sending: 'שולח...',
    form_helper: 'אחזור אליך אישית בוואצפ תוך 24 שעות',
    form_err_generic: 'שגיאה. נסה שוב.',
    form_done_title: 'קיבלתי. אני חוזר אליך.',
    form_done_body: 'אצור איתך קשר אישית בוואצפ תוך 24 שעות עם הצעדים הבאים והקישור לתשלום.',
  },
} as const

export default function FounderPage() {
  const locale = useLocale()
  useApplyHtmlDir(locale)
  const dir = dirFor(locale)
  const t = T[locale]
  const isEn = locale === 'en'
  const ArrowCta = isEn ? ArrowRight : ArrowLeft

  return (
    <div className="bg-zinc-950 text-white min-h-screen" dir={dir}>
      {/* HERO */}
      <section className="px-6 pt-16 pb-12 max-w-5xl mx-auto">
        <FadeIn className="flex items-center justify-center gap-3 mb-8">
          <Image src="/adigo-icon.png" alt="Adigo" width={56} height={56} className="rounded-full" priority />
          <span className="text-2xl font-black" dir="ltr">
            Adi<span className="text-sky-400">go</span>
          </span>
        </FadeIn>

        <FadeIn delay={80} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold text-sm">{t.badge}</span>
          </div>
        </FadeIn>

        <FadeIn delay={150}>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center leading-[1.15] mb-6">
            {t.hero_line_1}
            <br />
            <span className="bg-gradient-to-l from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              {t.hero_line_2}
            </span>
          </h1>
        </FadeIn>

        <FadeIn delay={300}>
          <p className="text-lg md:text-xl text-zinc-300 text-center max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.hero_sub_1}
            <br />
            <span className="text-white font-bold">{t.hero_sub_2}</span>
          </p>
        </FadeIn>

        <FadeIn delay={400}>
          <LeadForm t={t} dir={dir} arrow={ArrowCta} />
        </FadeIn>

        <FadeIn delay={550} className="flex justify-center mt-6">
          <p className="text-sm text-zinc-500">
            {t.seats_left_prefix ? `${t.seats_left_prefix} ` : ''}
            <span className="text-emerald-400 font-bold">{t.seats_left_bold}</span>{' '}
            {t.seats_left_suffix}
          </p>
        </FadeIn>
      </section>

      {/* PIVOT STORY */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            {t.pivot_h2}
          </h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-6 text-lg text-zinc-300 leading-relaxed">
          <p>{t.pivot_p1}</p>
          <p>
            {t.pivot_p2_a} <span className="text-white font-bold">{t.pivot_p2_b}</span>{' '}
            {t.pivot_p2_c}
          </p>
          <p>{t.pivot_p3}</p>
          <p className="text-2xl font-black text-white pt-2">{t.pivot_p4}</p>

          <div className="bg-gradient-to-br from-emerald-500/10 to-sky-500/5 border border-emerald-500/30 rounded-3xl p-7 md:p-10">
            <p className="text-lg leading-relaxed">
              {t.pivot_card_1_a} <span className="text-white font-bold">{t.pivot_card_1_b}</span>{' '}
              {t.pivot_card_1_c} <span className="text-white font-bold">{t.pivot_card_1_d}</span>{' '}
              {t.pivot_card_1_e} <span className="text-white font-bold">{t.pivot_card_1_f}</span>{' '}
              {t.pivot_card_1_g}
            </p>
            <p className="text-lg leading-relaxed mt-4">{t.pivot_card_2}</p>
          </div>
        </FadeIn>
      </section>

      {/* INCLUDED */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center">{t.included_h2}</h2>
          <p className="text-zinc-400 text-center mb-14 text-lg">{t.included_sub}</p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-5">
          <FadeIn delay={0}><IncludedCard icon={Code2} title={t.inc1_title} text={t.inc1_text} dir={dir} /></FadeIn>
          <FadeIn delay={100}><IncludedCard icon={undefined as unknown as React.ComponentType<{ className?: string }>} title={t.inc2_title} text={t.inc2_text} dir={dir} iconOverride="✨" /></FadeIn>
          <FadeIn delay={200}><IncludedCard icon={PlayCircle} title={t.inc3_title} text={t.inc3_text} dir={dir} /></FadeIn>
          <FadeIn delay={300}><IncludedCard icon={GitBranch} title={t.inc4_title} text={t.inc4_text} dir={dir} /></FadeIn>
          <FadeIn delay={400}><IncludedCard icon={Users} title={t.inc5_title} text={t.inc5_text} dir={dir} /></FadeIn>
          <FadeIn delay={500}><IncludedCard icon={InfinityIcon} title={t.inc6_title} text={t.inc6_text} dir={dir} /></FadeIn>
        </div>
      </section>

      {/* MATH */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{t.math_h2}</h2>
        </FadeIn>

        <FadeIn delay={100}>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-7 md:p-10 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
              <div>
                <p className="text-zinc-400 line-through">{t.math_saas}</p>
                <p className="text-2xl font-bold text-zinc-500 line-through">{t.math_saas_price}</p>
              </div>
              <p className="text-sm text-zinc-500">{t.math_saas_year}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300">{t.math_pack}</p>
                <p className="text-4xl md:text-5xl font-black text-emerald-400">{t.math_pack_price}</p>
                <p className="text-sm text-zinc-400 mt-1">{t.math_pack_note}</p>
              </div>
              <div className="text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs font-bold">{t.math_forever}</span>
                </div>
              </div>
            </div>

            <p className="text-zinc-300 leading-relaxed pt-2 border-t border-zinc-800">
              {t.math_summary_a} <span className="text-white font-bold">{t.math_summary_b}</span>{' '}
              {t.math_summary_c}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={200} className="mt-10">
          <LeadForm t={t} dir={dir} arrow={ArrowCta} />
        </FadeIn>
      </section>

      {/* WHO */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">{t.who_h2}</h2>
        </FadeIn>

        <FadeIn delay={100} className="space-y-4">
          <BenefitRow text={t.who_1} dir={dir} />
          <BenefitRow text={t.who_2} dir={dir} />
          <BenefitRow text={t.who_3} dir={dir} />
          <BenefitRow text={t.who_4} dir={dir} />
        </FadeIn>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <FadeIn>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">{t.faq_h2}</h2>
        </FadeIn>

        <div className="space-y-3">
          <FadeIn delay={0}><FaqItem question={t.faq1_q} dir={dir}><p>{t.faq1_a}</p></FaqItem></FadeIn>
          <FadeIn delay={80}><FaqItem question={t.faq2_q} dir={dir}><p>{t.faq2_a}</p></FaqItem></FadeIn>
          <FadeIn delay={160}><FaqItem question={t.faq3_q} dir={dir}><p>{t.faq3_a}</p></FaqItem></FadeIn>
          <FadeIn delay={240}><FaqItem question={t.faq4_q} dir={dir}><p>{t.faq4_a}</p></FaqItem></FadeIn>
          <FadeIn delay={320}><FaqItem question={t.faq5_q} dir={dir}><p>{t.faq5_a}</p></FaqItem></FadeIn>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-6 py-20 max-w-3xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            {t.final_h2}
          </h2>
          <p className="text-lg text-zinc-300 mb-10">
            {t.final_sub}
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <LeadForm t={t} dir={dir} arrow={ArrowCta} />
        </FadeIn>
      </section>

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
    </div>
  )
}

function LeadForm({
  t, dir, arrow: ArrowIcon,
}: {
  t: (typeof T)[keyof typeof T]
  dir: 'ltr' | 'rtl'
  arrow: React.ComponentType<{ className?: string }>
}) {
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
        setError(j.error ?? t.form_err_generic)
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
        dir={dir}
        className="max-w-md mx-auto bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/40 rounded-3xl p-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 mb-4">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3">{t.form_done_title}</h3>
        <p className="text-zinc-300 leading-relaxed">
          {t.form_done_body}
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={onSubmit}
      dir={dir}
      className="max-w-md mx-auto bg-zinc-900/70 border border-zinc-800 rounded-3xl p-7 space-y-4"
    >
      <div>
        <label htmlFor="founder-name" className="block text-sm font-bold text-zinc-300 mb-1.5">
          {t.form_name_label}
        </label>
        <input
          id="founder-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.form_name_ph}
          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="founder-phone" className="block text-sm font-bold text-zinc-300 mb-1.5">
          {t.form_phone_label}
        </label>
        <input
          id="founder-phone"
          type="tel"
          inputMode="numeric"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.form_phone_ph}
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
        {loading ? t.form_sending : t.form_cta}
        {!loading && <ArrowIcon className="w-4 h-4" />}
      </button>

      <p className="text-xs text-zinc-500 text-center">
        {t.form_helper}
      </p>
    </form>
  )
}

function IncludedCard({
  icon: Icon,
  iconOverride,
  title,
  text,
  dir,
}: {
  icon?: React.ComponentType<{ className?: string }>
  iconOverride?: string
  title: string
  text: string
  dir: 'ltr' | 'rtl'
}) {
  return (
    <div
      dir={dir}
      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 h-full hover:border-emerald-500/30 transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
        {Icon ? <Icon className="w-5 h-5 text-emerald-400" /> : <span className="text-emerald-400 text-lg">{iconOverride}</span>}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-zinc-300 leading-relaxed">{text}</p>
    </div>
  )
}

function BenefitRow({ text, dir }: { text: string; dir: 'ltr' | 'rtl' }) {
  return (
    <div
      dir={dir}
      className="flex items-start gap-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5"
    >
      <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
        <Check className="w-4 h-4 text-emerald-400" />
      </div>
      <p className="text-zinc-200 leading-relaxed pt-1">{text}</p>
    </div>
  )
}

function FaqItem({ question, children, dir }: { question: string; children: React.ReactNode; dir: 'ltr' | 'rtl' }) {
  return (
    <details className="bg-zinc-900/60 border border-zinc-800 rounded-2xl group open:border-zinc-700 transition-colors" dir={dir}>
      <summary className="cursor-pointer p-6 flex items-center justify-between gap-4 font-bold text-lg list-none">
        <span>{question}</span>
        <ChevronDown className="w-5 h-5 text-zinc-500 transition-transform group-open:rotate-180 shrink-0" />
      </summary>
      <div className="px-6 pb-6 text-zinc-300 leading-relaxed border-t border-zinc-800 pt-5">{children}</div>
    </details>
  )
}
