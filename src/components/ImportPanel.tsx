import { useRef, useState, type ChangeEvent } from 'react'
import { DatabaseZap, FileUp, Trash2 } from 'lucide-react'
import { parseExistingConfig } from '../lib/importCfg'
import type { ExistingConfig, Notify } from '../lib/types'

interface Props {
  existing: ExistingConfig
  startOnuId: number
  onChange: (e: ExistingConfig) => void
  notify: Notify
}

function nextFree(used: number[], start: number): number {
  const set = new Set(used)
  let id = Math.max(1, start)
  while (set.has(id)) id++
  return id
}

export default function ImportPanel({ existing, startOnuId, onChange, notify }: Props) {
  const [text, setText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const apply = (src: string) => {
    const result = parseExistingConfig(src)
    const total = Object.values(result.used).reduce((n, a) => n + a.length, 0)
    if (total === 0) {
      notify('Tidak ada ONU terdeteksi. Pastikan formatnya config OLT.', 'err')
      return
    }
    onChange(result)
    setText('')
    notify(`${total} ONU terdeteksi di ${Object.keys(result.used).length} PON`, 'ok')
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) apply(await file.text())
  }

  const entries = Object.entries(existing.used).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))

  return (
    <div className="animate-fade-in space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tempel isi config OLT yang sudah berjalan (mis. hasil <code className="font-mono">show running-config</code>).
        Aplikasi mendeteksi ONU ID yang sudah terpakai per PON, lalu penomoran pelanggan baru dilanjutkan dari ID kosong
        berikutnya. SN yang sudah terdaftar akan ditandai duplikat.
      </p>

      <textarea
        className="field min-h-[160px] resize-y font-mono text-xs"
        placeholder={'interface gpon-olt_1/1\nonu 1 type ZTE-F609 sn GPON1A2B3C4D\nexit\n...'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
      />

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={!text.trim()} onClick={() => apply(text)}>
          <DatabaseZap size={16} /> Analisis & simpan
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <FileUp size={16} /> Upload file .cfg
        </button>
        <input ref={fileRef} type="file" accept=".cfg,.txt,.conf,.log" className="hidden" onChange={onFile} />
      </div>

      {entries.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Terdeteksi di OLT</h3>
            <button
              className="btn-danger !px-2.5 !py-1 text-xs"
              onClick={() => {
                onChange({ used: {}, sns: [] })
                notify('Data impor dihapus', 'info')
              }}
            >
              <Trash2 size={13} /> Hapus data impor
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {entries.map(([key, ids]) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="font-mono text-xs text-slate-400">PON {key}</div>
                <div className="text-lg font-semibold">{ids.length} ONU</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  ID berikutnya: <span className="font-mono text-cyan-600 dark:text-cyan-300">{nextFree(ids, startOnuId)}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{existing.sns.length} SN terdaftar dikenali.</p>
        </div>
      )}
    </div>
  )
}
