import { getAllCustomers } from '@/lib/customers'
import { CustomersTable } from './customers-table'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
  const customers = await getAllCustomers()
  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">לקוחות</h2>
        <p className="text-zinc-400 text-sm mt-1">{customers.length} משתמשים רשומים במערכת</p>
      </div>
      <CustomersTable customers={customers} />
    </div>
  )
}
