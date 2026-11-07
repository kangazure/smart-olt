import { RotateCcw } from 'lucide-react'
import { DEFAULT_PARAMS } from '../lib/defaults'
import type { Params } from '../lib/types'
import NumberField from './NumberField'

const SPEEDS = ['10M', '20M', '30M', '50M', '100M']
const TYPES = ['ZTE-F609', 'ZTE-F660', 'ZTE-F670L', 'ZTE-F663N', 'ALL']

interface Props {
  params: Params
  onChange: (p: Params) => void
}

export default function ParamsPanel({ params, onChange }: Props) {
  const set = <K extends keyof Params>(key: K, value: Params[K]) => onChange({ ...params, [key]: value })

  return (
    <div className="animate-fade-in space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Slot" value={params.slot} min={0} max={99} onChange={(n) => set('slot', n)} />
        <NumberField
          label="PON bawaan"
          value={params.pon}
          min={1}
          max={99}
          onChange={(n) => set('pon', n)}
          hint="Dipakai jika PON tidak diisi"
        />
        <NumberField label="VLAN" value={params.vlan} min={1} max={4094} onChange={(n) => set('vlan', n)} />
        <NumberField
          label="ONU ID awal"
          value={params.startOnuId}
          min={1}
          max={128}
          onChange={(n) => set('startOnuId', n)}
          hint="Penomoran otomatis mulai dari sini"
        />
      </div>

      <label className="block">
        <span className="label">Tipe ONU</span>
        <input
          className="field font-mono"
          list="onu-types"
          value={params.onuType}
          onChange={(e) => set('onuType', e.target.value.trim())}
          placeholder="mis. ZTE-F609"
        />
        <datalist id="onu-types">
          {TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
          Sesuaikan dengan tipe ONU yang terdaftar di OLT kamu.
        </span>
      </label>

      <div>
        <span className="label">Kecepatan / nama profile</span>
        <input
          className="field font-mono"
          value={params.speed}
          onChange={(e) => set('speed', e.target.value.trim())}
          placeholder="30M"
        />
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => set('speed', s)}
              className={`chip ${params.speed === s ? '!border-cyan-500/60 !text-cyan-600 dark:!text-cyan-300' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="mt-2 block text-[11px] text-slate-400 dark:text-slate-500">
          Dipakai untuk <code className="font-mono">tcont profile</code> dan <code className="font-mono">traffic-limit</code>.
          Pastikan profile dengan nama ini sudah ada di OLT.
        </span>
      </div>

      <button className="btn-ghost" onClick={() => onChange(DEFAULT_PARAMS)}>
        <RotateCcw size={15} /> Reset parameter
      </button>
    </div>
  )
}
