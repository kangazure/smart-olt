import { useRef, useState, type RefObject } from 'react'
import { RotateCcw } from 'lucide-react'
import { DEFAULT_TEMPLATES, PLACEHOLDERS } from '../lib/defaults'
import type { Templates } from '../lib/types'

type Key = keyof Templates

const SECTIONS: { key: Key; title: string; hint: string; rows: number }[] = [
  { key: 'header', title: 'Header', hint: 'Ditulis sekali di awal', rows: 3 },
  { key: 'block', title: 'Blok per pelanggan', hint: 'Diulang untuk setiap pelanggan', rows: 22 },
  { key: 'footer', title: 'Footer', hint: 'Ditulis sekali di akhir', rows: 3 },
]

interface Props {
  templates: Templates
  onChange: (t: Templates) => void
}

export default function TemplatePanel({ templates, onChange }: Props) {
  const [active, setActive] = useState<Key>('block')
  const headerRef = useRef<HTMLTextAreaElement>(null)
  const blockRef = useRef<HTMLTextAreaElement>(null)
  const footerRef = useRef<HTMLTextAreaElement>(null)
  const refs: Record<Key, RefObject<HTMLTextAreaElement | null>> = {
    header: headerRef,
    block: blockRef,
    footer: footerRef,
  }

  const insert = (token: string) => {
    const el = refs[active].current
    if (!el) return
    const s = el.selectionStart
    const e = el.selectionEnd
    const v = templates[active]
    onChange({ ...templates, [active]: v.slice(0, s) + token + v.slice(e) })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + token.length, s + token.length)
    })
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div>
        <span className="label">Placeholder (klik untuk menyisipkan ke kotak yang aktif)</span>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <button
              key={p.token}
              type="button"
              className="chip"
              title={p.desc}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(p.token)}
            >
              {p.token}
            </button>
          ))}
        </div>
      </div>

      {SECTIONS.map((s) => (
        <label key={s.key} className="block">
          <span className="label flex items-center justify-between">
            <span>{s.title}</span>
            <span className="font-normal text-slate-400 dark:text-slate-500">{s.hint}</span>
          </span>
          <textarea
            ref={refs[s.key]}
            className={`field resize-y font-mono text-xs leading-5 ${active === s.key ? '' : 'opacity-90'}`}
            rows={s.rows}
            value={templates[s.key]}
            onFocus={() => setActive(s.key)}
            onChange={(e) => onChange({ ...templates, [s.key]: e.target.value })}
            spellCheck={false}
          />
        </label>
      ))}

      <button
        className="btn-ghost"
        onClick={() => {
          if (window.confirm('Kembalikan template ke bawaan?')) onChange(DEFAULT_TEMPLATES)
        }}
      >
        <RotateCcw size={15} /> Reset ke template bawaan
      </button>
    </div>
  )
}
