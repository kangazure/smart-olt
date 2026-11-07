import type { ExistingConfig } from './types'

/**
 * Baca config OLT yang sudah ada (show running-config) dan kumpulkan
 * ONU ID yang terpakai per "slot/pon" beserta SN yang sudah terdaftar.
 */
export function parseExistingConfig(text: string): ExistingConfig {
  const used = new Map<string, Set<number>>()
  const sns = new Set<string>()
  let current: string | null = null

  const mark = (key: string, id: number) => {
    let s = used.get(key)
    if (!s) {
      s = new Set()
      used.set(key, s)
    }
    s.add(id)
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue

    const olt = /^interface\s+gpon-olt_(\d+)\/(\d+)/i.exec(line)
    if (olt) {
      current = `${Number(olt[1])}/${Number(olt[2])}`
      continue
    }

    const onuIface = /^interface\s+gpon-onu_(\d+)\/(\d+):(\d+)/i.exec(line)
    if (onuIface) {
      mark(`${Number(onuIface[1])}/${Number(onuIface[2])}`, Number(onuIface[3]))
      current = null
      continue
    }

    if (/^(interface|pon-onu-mng)\b/i.test(line) || /^exit\b/i.test(line)) {
      current = null
      continue
    }

    const onu = /^onu\s+(\d+)\s+type\s+\S+.*?\bsn\s+(\S+)/i.exec(line)
    if (onu && current) {
      mark(current, Number(onu[1]))
      sns.add(onu[2].toUpperCase())
    }
  }

  const out: Record<string, number[]> = {}
  for (const [k, set] of used) out[k] = [...set].sort((a, b) => a - b)
  return { used: out, sns: [...sns] }
}
