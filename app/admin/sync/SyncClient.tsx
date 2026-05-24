'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle,
  Loader2, AlertTriangle, ChevronDown, ChevronUp, History
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SyncLog } from '@/lib/types'

type Step = 'idle' | 'uploading' | 'preview' | 'confirming' | 'done' | 'error'

interface PreviewData {
  fileName: string
  sheetsFound: string[]
  residents: { count: number; sample: Record<string, string>[] }
  invoices: { count: number; matched: number; unmatched: number; sample: Record<string, string>[] }
  expenses: { count: number; sample: Record<string, string>[] }
  errors: string[]
}

interface ParsedData {
  residents: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  expenses: Record<string, unknown>[]
  fileName: string
}

interface SyncResult {
  residents: { new: number; updated: number }
  invoices: { new: number; updated: number }
  expenses: { new: number; updated: number }
}

interface Props { logs: SyncLog[] }

export function SyncClient({ logs }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('idle')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [result, setResult] = useState<SyncResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showLogs, setShowLogs] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrorMsg('File harus berformat .xlsx atau .xls')
      setStep('error')
      return
    }

    setStep('uploading')
    setErrorMsg('')

    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/admin/sync', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Gagal memproses file')
      setStep('error')
      return
    }

    setPreview(data.preview)
    setParsedData(data.data)
    setStep('preview')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleConfirm = async () => {
    if (!parsedData) return
    setStep('confirming')

    const res = await fetch('/api/admin/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedData),
    })
    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error ?? 'Gagal menyimpan data')
      setStep('error')
      return
    }

    setResult(data.result)
    setStep('done')
    router.refresh()
  }

  const reset = () => {
    setStep('idle')
    setPreview(null)
    setParsedData(null)
    setResult(null)
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload Data</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sinkronisasi data dari Odoo ke portal web
        </p>
      </div>

      {/* Format info */}
      <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-sm text-foreground">
        <p className="font-semibold mb-1.5">Format File Excel (3 Sheet):</p>
        <div className="space-y-0.5 text-xs text-muted-foreground">
          <div>📋 Sheet <code className="bg-muted px-1 rounded">Residents</code> — data warga dari res.partner</div>
          <div>📄 Sheet <code className="bg-muted px-1 rounded">Invoices</code> / <code className="bg-muted px-1 rounded">IPL</code> — tagihan IPL warga</div>
          <div>💸 Sheet <code className="bg-muted px-1 rounded">Expenses</code> / <code className="bg-muted px-1 rounded">Pengeluaran</code> — vendor bills</div>
        </div>
      </div>

      {/* Upload Zone */}
      {step === 'idle' && (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-primary/5 group"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">
            Drag & drop file Excel di sini
          </p>
          <p className="text-xs text-muted-foreground">atau klik untuk pilih file</p>
          <p className="text-xs text-muted-foreground mt-2">.xlsx · .xls</p>
        </div>
      )}

      {/* Uploading */}
      {step === 'uploading' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Membaca file Excel...</p>
          <p className="text-xs text-muted-foreground">Mohon tunggu</p>
        </div>
      )}

      {/* Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 p-3.5 bg-card border border-border/50 rounded-xl">
            <FileSpreadsheet className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">{preview.fileName}</p>
              <p className="text-xs text-muted-foreground">
                Sheet: {preview.sheetsFound.join(', ')}
              </p>
            </div>
          </div>

          {/* Count summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Residents', count: preview.residents.count, icon: '👥' },
              { label: 'Invoices', count: preview.invoices.count, icon: '📄' },
              { label: 'Expenses', count: preview.expenses.count, icon: '💸' },
            ].map(({ label, count, icon }) => (
              <Card key={label} className="border-border/50">
                <CardContent className="p-3 text-center">
                  <p className="text-lg">{icon}</p>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Invoice matching */}
          {preview.invoices.unmatched > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800">
                <span className="font-semibold">{preview.invoices.unmatched} invoice</span> tidak dapat di-match ke warga (blok tidak ditemukan). Tetap tersimpan tanpa relasi ke warga.
              </p>
            </div>
          )}

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {preview.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Preview tables */}
          {preview.invoices.sample.length > 0 && (
            <PreviewTable title="Preview Invoice (5 pertama)" rows={preview.invoices.sample}
              cols={['invoice_number', 'month_period', 'year_period', 'blok', 'status']} />
          )}

          {preview.residents.sample.length > 0 && (
            <PreviewTable title="Preview Residents (5 pertama)" rows={preview.residents.sample}
              cols={['name', 'blok', 'mobile', 'web_role']} />
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 h-11 border border-border rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Batalkan
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              ✓ Konfirmasi Import
            </button>
          </div>
        </div>
      )}

      {/* Confirming */}
      {step === 'confirming' && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground">Menyimpan data ke database...</p>
          <p className="text-xs text-muted-foreground">Mohon jangan tutup halaman ini</p>
        </div>
      )}

      {/* Done */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-foreground">Import Berhasil!</p>
          </div>

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 space-y-3">
              {[
                { label: 'Residents', data: result.residents },
                { label: 'Invoices', data: result.invoices },
                { label: 'Expenses', data: result.expenses },
              ].map(({ label, data }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{label}</span>
                  <div className="flex gap-3">
                    <span className="text-emerald-700">+{data.new} baru</span>
                    <span className="text-muted-foreground">↻{data.updated} update</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <button
            onClick={reset}
            className="w-full h-11 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors"
          >
            Upload File Lain
          </button>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-base font-bold text-foreground">Upload Gagal</p>
            <p className="text-sm text-muted-foreground text-center px-4">{errorMsg}</p>
          </div>
          <button
            onClick={reset}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Sync History */}
      {logs.length > 0 && (
        <div>
          <button
            onClick={() => setShowLogs(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground w-full py-2"
          >
            <History className="w-4 h-4" />
            Riwayat Sync ({logs.length})
            {showLogs ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
          </button>

          {showLogs && (
            <div className="space-y-2 mt-2">
              {logs.map(log => (
                <div key={log.id} className="p-3 rounded-xl border border-border/50 bg-card text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-foreground">
                      {new Date(log.sync_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}
                      className={cn('text-[10px] h-4', log.status === 'success' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100')}>
                      {log.status === 'success' ? 'Sukses' : 'Error'}
                    </Badge>
                  </div>
                  {log.file_name && (
                    <p className="text-muted-foreground truncate mb-1">{log.file_name}</p>
                  )}
                  <div className="flex gap-3 text-muted-foreground">
                    <span>👥 +{log.residents_new} ↻{log.residents_updated}</span>
                    <span>📄 +{log.invoices_new} ↻{log.invoices_updated}</span>
                    <span>💸 +{log.expenses_new} ↻{log.expenses_updated}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

function PreviewTable({ title, rows, cols }: {
  title: string
  rows: Record<string, unknown>[]
  cols: string[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr>
              {cols.map(c => (
                <th key={c} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/30">
                {cols.map(c => (
                  <td key={c} className="px-3 py-2 text-foreground truncate max-w-[120px]">
                    {String(row[c] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
