export type Role = 'resident' | 'admin' | 'treasurer' | 'chairman'

export interface Resident {
  id: string
  name: string
  blok: string
  mobile: string
  role: Role
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  invoice_date: string | null
  month_period: string
  year_period: string
  resident_name: string | null
  blok: string | null
  amount_total: number
  amount_due: number
  status: 'Paid' | 'Not Paid'
  resident_id: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  bill_number: string
  bill_date: string | null
  due_date: string | null
  vendor_name: string | null
  description: string | null
  amount_total: number
  amount_due: number
  payment_status: 'paid' | 'not_paid' | 'partial' | 'in_payment'
  created_at: string
  updated_at: string
}

export interface SyncLog {
  id: string
  sync_at: string
  synced_by: string | null
  file_name: string | null
  residents_new: number
  residents_updated: number
  invoices_new: number
  invoices_updated: number
  expenses_new: number
  expenses_updated: number
  status: string
  notes: string | null
}

export interface JWTPayload {
  sub: string
  name: string
  blok: string
  role: Role
  iat: number
  exp: number
}

export interface ResidentSummary {
  resident: Resident
  totalInvoices: number
  paidCount: number
  unpaidCount: number
  totalDue: number
}
