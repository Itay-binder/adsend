import Link from 'next/link'

export default function SubscribeFailedPage() {
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-black text-white mb-2">התשלום נכשל</h1>
        <p className="text-zinc-400 mb-8">משהו השתבש. אפשר לנסות שוב.</p>
        <Link
          href="/subscribe"
          className="inline-block px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
        >
          ניסיון חוזר
        </Link>
      </div>
    </div>
  )
}
