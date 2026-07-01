// English dashboard shell — LTR, minimal top bar (no sidebar for MVP; we'll
// mirror the full sidebar in a follow-up once the English funnel proves out).
export const dynamic = 'force-dynamic'

export default function DashboardEnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-zinc-900 flex-row" dir="ltr">
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
