import { getCustomerDetail } from '@/lib/customers'
import { notFound } from 'next/navigation'
import { CustomerClient } from './customer-client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getCustomerDetail(id)
  if (!data) notFound()

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300 mb-4">
        <ArrowRight className="w-4 h-4" />
        חזרה לרשימה
      </Link>
      <CustomerClient
        userId={id}
        email={data.user.email ?? ''}
        fullName={(data.user.user_metadata?.full_name as string) ?? ''}
        createdAt={data.user.created_at}
        lastSignInAt={data.user.last_sign_in_at ?? null}
        waSession={data.waSession}
        metaConn={data.metaConn}
        adAccounts={data.adAccounts}
        subscription={data.subscription}
        uploads={data.uploads}
      />
    </div>
  )
}
