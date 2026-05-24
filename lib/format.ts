export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function monthOrder(month: string): number {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ]
  return months.indexOf(month)
}

export function monthIndo(month: string): string {
  const map: Record<string, string> = {
    January: 'Januari', February: 'Februari', March: 'Maret',
    April: 'April', May: 'Mei', June: 'Juni',
    July: 'Juli', August: 'Agustus', September: 'September',
    October: 'Oktober', November: 'November', December: 'Desember',
  }
  return map[month] ?? month
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    resident: 'Warga',
    admin: 'Admin',
    treasurer: 'Bendahara',
    chairman: 'Ketua',
  }
  return map[role] ?? role
}

export function syncTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} menit lalu`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} jam lalu`
  const days = Math.floor(hrs / 24)
  return `${days} hari lalu`
}
