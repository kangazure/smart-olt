import type { ExistingConfig } from './types'

/**
 * Baca config OLT yang sudah ada (show running-config) dan kumpulkan
 * ONU ID yang terpakai per "slot/pon" beserta SN yang sudah terdaftar.
 *
 * Mendukung dua format:
 * 1. Huawei-style:   interface gpon-olt_<slot>/<pon>  +  onu <id> type ... sn <sn>
 * 2. Generic-style:  interface gpon <slot>/<pon>      +  onu add <id> profile ... sn <sn>
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

    // Format Huawei: interface gpon-olt_1/1
    const oltHuawei = /^interface\s+gpon-olt_(\d+)\/(\d+)/i.exec(line)
    if (oltHuawei) {
      current = `${Number(oltHuawei[1])}/${Number(oltHuawei[2])}`
      continue
    }

    // Format generic: interface gpon 0/1
    const oltGeneric = /^interface\s+gpon\s+(\d+)\/(\d+)/i.exec(line)
    if (oltGeneric) {
      current = `${Number(oltGeneric[1])}/${Number(oltGeneric[2])}`
      continue
    }

    // Huawei: interface gpon-onu_1/3:7 → PON 1/3, ONU 7
    const onuIface = /^interface\s+gpon-onu_(\d+)\/(\d+):(\d+)/i.exec(line)
    if (onuIface) {
      mark(`${Number(onuIface[1])}/${Number(onuIface[2])}`, Number(onuIface[3]))
      current = null
      continue
    }

    // Reset context on exit / new interface block
    if (/^(interface|pon-onu-mng)\b/i.test(line) || /^exit\b/i.test(line)) {
      current = null
      continue
    }

    // Huawei format: onu 1 type ZTE-F609 sn GPON1A2B3C4D
    if (current) {
      const onuHuawei = /^onu\s+(\d+)\s+type\s+\S+.*?\bsn\s+(\S+)/i.exec(line)
      if (onuHuawei) {
        mark(current, Number(onuHuawei[1]))
        sns.add(onuHuawei[2].toUpperCase())
        continue
      }

      // Generic format: onu add 1 profile default sn VSOL0022051c
      const onuGeneric = /^onu\s+add\s+(\d+)\s+profile\s+\S+\s+sn\s+(\S+)/i.exec(line)
      if (onuGeneric) {
        mark(current, Number(onuGeneric[1]))
        sns.add(onuGeneric[2].toUpperCase())
      }
    }
  }

  const out: Record<string, number[]> = {}
  for (const [k, set] of used) out[k] = [...set].sort((a, b) => a - b)
  return { used: out, sns: [...sns] }
}
