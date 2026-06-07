import { requireAdmin } from '@/lib/auth'
import { Nav } from '@/components/nav'

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  return (
    <div className="flex min-h-screen">
      <Nav email={user.email ?? ''} />
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  )
}
