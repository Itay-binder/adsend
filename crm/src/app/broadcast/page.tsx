import { getAllCustomers } from '@/lib/customers'
import { BroadcastClient } from './broadcast-client'

export const dynamic = 'force-dynamic'

export default async function BroadcastPage() {
  const customers = await getAllCustomers()
  const withPhone = customers
    .filter(c => c.waPhone)
    .map(c => ({ id: c.id, email: c.email, fullName: c.fullName, phone: c.waPhone! }))

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">דיוור WhatsApp</h2>
        <p className="text-zinc-400 text-sm mt-1">
          שלח הודעה לכל הלקוחות במערכת ({withPhone.length} עם WhatsApp)
        </p>
      </div>
      <BroadcastClient recipients={withPhone} />
    </div>
  )
}
