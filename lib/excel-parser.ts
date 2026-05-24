import * as XLSX from 'xlsx'

export interface ParsedResident {
  name: string
  mobile: string
  blok: string
  web_password: string
  web_active: boolean
  web_role: string
}

export interface ParsedInvoice {
  invoice_number: string
  invoice_date: string | null
  month_period: string
  year_period: string
  resident_name: string
  blok: string
  amount_total: number
  amount_due: number
  status: 'Paid' | 'Not Paid'
}

export interface ParsedExpense {
  bill_number: string
  bill_date: string | null
  due_date: string | null
  vendor_name: string
  description: string
  amount_total: number
  amount_due: number
  payment_status: string
}

export interface ParseResult {
  residents: ParsedResident[]
  invoices: ParsedInvoice[]
  expenses: ParsedExpense[]
  sheetsFound: string[]
  errors: string[]
}

function excelDateToISO(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
  }
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (!d) return null
    const month = String(d.m).padStart(2, '0')
    const day = String(d.d).padStart(2, '0')
    return `${d.y}-${month}-${day}`
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }
  return null
}

function str(val: unknown): string {
  return val == null ? '' : String(val).trim()
}

function num(val: unknown): number {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

function parseResidents(ws: XLSX.WorkSheet): ParsedResident[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const results: ParsedResident[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const name = str(row[0])
    if (!name) continue

    results.push({
      name,
      mobile: str(row[1]),
      blok: str(row[2]),
      web_password: str(row[3]),
      web_active: str(row[4]).toLowerCase() === 'true' || str(row[4]) === '1' || str(row[4]).toLowerCase() === 'ya',
      web_role: str(row[5]) || 'resident',
    })
  }
  return results
}

function parseInvoices(ws: XLSX.WorkSheet): ParsedInvoice[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const seen = new Map<string, ParsedInvoice>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const invoiceNum = str(row[0])
    if (!invoiceNum.startsWith('IPL/') && !invoiceNum.startsWith('TIPL/')) continue

    const rawStatus = str(row[8])
    const status: 'Paid' | 'Not Paid' = rawStatus === 'Paid' ? 'Paid' : 'Not Paid'

    seen.set(invoiceNum, {
      invoice_number: invoiceNum,
      invoice_date: excelDateToISO(row[1]),
      month_period: str(row[2]),
      year_period: str(row[3]),
      resident_name: str(row[4]),
      blok: str(row[5]),
      amount_total: num(row[6]),
      amount_due: num(row[7]),
      status,
    })
  }
  return Array.from(seen.values())
}

function parseExpenses(ws: XLSX.WorkSheet): ParsedExpense[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  const results: ParsedExpense[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const billNum = str(row[0])
    if (!billNum) continue

    const rawStatus = str(row[7]).toLowerCase()
    let paymentStatus = 'not_paid'
    if (rawStatus === 'paid' || rawStatus === 'in_payment') paymentStatus = rawStatus
    else if (rawStatus.includes('partial')) paymentStatus = 'partial'
    else if (rawStatus === 'full') paymentStatus = 'paid'

    results.push({
      bill_number: billNum,
      bill_date: excelDateToISO(row[1]),
      due_date: excelDateToISO(row[2]),
      vendor_name: str(row[3]),
      description: str(row[4]),
      amount_total: num(row[5]),
      amount_due: num(row[6]),
      payment_status: paymentStatus,
    })
  }
  return results
}

export function parseIPLExcel(buffer: ArrayBuffer): ParseResult {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const errors: string[] = []
  const sheetsFound: string[] = wb.SheetNames

  let residents: ParsedResident[] = []
  let invoices: ParsedInvoice[] = []
  let expenses: ParsedExpense[] = []

  // Cari sheet berdasarkan nama (case-insensitive, partial match)
  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase()
    const ws = wb.Sheets[sheetName]

    if (lower.includes('resident') || lower.includes('warga')) {
      residents = parseResidents(ws)
    } else if (lower.includes('invoice') || lower.includes('ipl') || lower.includes('tagihan')) {
      const parsed = parseInvoices(ws)
      // Deduplicate across sheets — last wins
      const map = new Map(invoices.map(i => [i.invoice_number, i]))
      parsed.forEach(p => map.set(p.invoice_number, p))
      invoices = Array.from(map.values())
    } else if (lower.includes('expense') || lower.includes('pengeluaran') || lower.includes('bill')) {
      expenses = parseExpenses(ws)
    } else {
      // Fallback: coba parse sebagai invoice jika ada kolom IPL/
      const parsed = parseInvoices(ws)
      if (parsed.length > 0) {
        const map = new Map(invoices.map(i => [i.invoice_number, i]))
        parsed.forEach(p => map.set(p.invoice_number, p))
        invoices = Array.from(map.values())
      }
    }
  }

  if (invoices.length === 0 && residents.length === 0 && expenses.length === 0) {
    errors.push('Tidak ada data valid ditemukan dalam file. Pastikan format sheet sesuai.')
  }

  return { residents, invoices, expenses, sheetsFound, errors }
}
