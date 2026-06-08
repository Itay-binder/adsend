import { BookOpen, MessageCircle, Lightbulb, ChevronLeft, Phone } from 'lucide-react'

const guides = [
  {
    icon: '🚀',
    color: 'bg-blue-500/20 text-blue-400',
    title: 'התחלה מהירה',
    desc: 'חיבור ווצאפ ו-Meta בפחות מ-5 דקות',
    badge: 'מומלץ להתחלה',
  },
  {
    icon: '💬',
    color: 'bg-emerald-500/20 text-emerald-400',
    title: 'פקודות הבוט',
    desc: 'כל מה שהבוט מבין — דוגמאות להודעות',
  },
  {
    icon: '🎯',
    color: 'bg-purple-500/20 text-purple-400',
    title: 'טיפים לטסטים מהירים',
    desc: 'איך להוציא ממצב Adigo את המקסימום',
  },
]

const faqs = [
  { q: 'מה קורה כשה-Session של ווצאפ פג?', a: 'נקבל הודעה ויהיה צריך לסרוק QR מחדש — תהליך של דקה.' },
  { q: 'אפשר לחבר כמה חשבונות מודעות?', a: 'כן, ניתן לחבר מספר חשבונות ב-OAuth ולבחור בכל שליחה.' },
  { q: 'האם הבוט מבין עברית?', a: 'כן, הבוט מופעל על Claude Haiku ומבין עברית מלאה.' },
  { q: 'מה קורה אם אני שולח קריאייטיב בלי לציין קמפיין?', a: 'הבוט ישאל אותך: "לאיזה קמפיין? הפעילים שלך: 1. XXX 2. YYY"' },
  { q: 'האם ניתן לביטול בכל עת?', a: 'כן, ביטול מיידי — ללא עלויות נוספות.' },
]

export default function AcademyPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-2">אקדמיה</h2>
      <p className="text-zinc-400 mb-8">מדריכים ושאלות נפוצות</p>

      {/* Guides */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> מדריכים
        </h3>
        <div className="flex flex-col gap-3">
          {guides.map(g => (
            <div key={g.title} className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-600 transition-colors cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl ${g.color} flex items-center justify-center text-lg shrink-0`}>
                {g.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium text-sm">{g.title}</p>
                  {g.badge && <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">{g.badge}</span>}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">{g.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Bot commands cheatsheet */}
      <div className="mb-10 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-400 mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" /> דוגמאות להודעות לבוט
        </h3>
        <div className="flex flex-col gap-2">
          {[
            '[שולח תמונה] — הבוט ישאל לאן להעלות',
            '[שולח סרטון] + "רטרגטינג קר, טקסט: \'כבר 3 שנים...\'"',
            '"העלה כ-ACTIVE לקמפיין prospecting"',
            '"כן" / "לא" — לאישור / ביטול',
          ].map(ex => (
            <div key={ex} className="bg-zinc-900/50 rounded-lg px-3 py-2 font-mono text-xs text-emerald-300">
              {ex}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-10">
        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4" /> שאלות נפוצות
        </h3>
        <div className="flex flex-col gap-2">
          {faqs.map(f => (
            <details key={f.q} className="group bg-zinc-800/40 border border-zinc-700/50 rounded-xl overflow-hidden">
              <summary className="px-4 py-3 text-sm font-medium text-white cursor-pointer flex items-center justify-between list-none">
                {f.q}
                <ChevronLeft className="w-4 h-4 text-zinc-500 group-open:-rotate-90 transition-transform" />
              </summary>
              <div className="px-4 pb-3 text-zinc-400 text-sm border-t border-zinc-700/50 pt-3">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-white font-medium">צריך עזרה?</p>
          <p className="text-zinc-400 text-sm mt-0.5">אנחנו זמינים בווצאפ</p>
        </div>
        <a
          href="https://wa.me/972526660006?text=היי%2C%20אני%20צריך%20עזרה%20עם%20Adigo"
          target="_blank"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Phone className="w-4 h-4" /> דבר איתנו
        </a>
      </div>
    </div>
  )
}
