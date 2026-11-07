import { describe, expect, it } from 'vitest'
import { DEFAULT_PARAMS, DEFAULT_TEMPLATES } from './defaults'
import { analyze, generateConfig } from './generator'
import { parseExistingConfig } from './importCfg'

const sample = `
interface gpon-olt_1/1
  onu 1 type ZTE-F609 sn GPON1A2B3C4D
  onu 2 type ZTE-F660 sn ZTEGC1234567
exit
interface gpon-olt_1/2
  onu 5 type ZTE-F609 sn gpon0000aaaa
exit
interface gpon-onu_1/3:7
  name Seseorang
  sn-bind enable sn
exit
`

const sampleGeneric = `
interface gpon 0/1
onu auto-learn
plug_and_play enable
onu add 1 profile default sn VSOL0022051c
onu 1 desc yustina-sb6
onu add 2 profile default sn GPON00445d1e
onu 2 desc sarmiati-sb2
onu add 5 profile default sn GPON0048de88
onu 5 desc intanerni-sb6
exit
interface gpon 0/2
onu auto-learn
onu add 3 profile default sn ZTEGcd195ee5
onu add 10 profile default sn ZTEGccce79c5
exit
`

describe('parseExistingConfig', () => {
  it('mengumpulkan ONU ID terpakai per PON dan SN (format Huawei)', () => {
    const r = parseExistingConfig(sample)
    expect(r.used['1/1']).toEqual([1, 2])
    expect(r.used['1/2']).toEqual([5])
    expect(r.used['1/3']).toEqual([7])
    expect(r.sns).toEqual(expect.arrayContaining(['GPON1A2B3C4D', 'ZTEGC1234567', 'GPON0000AAAA']))
  })

  it('mengumpulkan ONU ID terpakai per PON dan SN (format generic)', () => {
    const r = parseExistingConfig(sampleGeneric)
    expect(r.used['0/1']).toEqual([1, 2, 5])
    expect(r.used['0/2']).toEqual([3, 10])
    expect(r.sns).toEqual(
      expect.arrayContaining(['VSOL0022051C', 'GPON00445D1E', 'GPON0048DE88', 'ZTEGCD195EE5', 'ZTEGCCCE79C5'])
    )
  })

  it('hasil generate bisa dibaca balik (round trip)', () => {
    const rows = analyze(
      [{ id: '1', sn: 'GPON1A2B3C4D', name: 'Budi', pon: 1, onuId: null }],
      DEFAULT_PARAMS,
      { used: {}, sns: [] },
    )
    const r = parseExistingConfig(generateConfig(rows, DEFAULT_PARAMS, DEFAULT_TEMPLATES))
    expect(r.used['1/1']).toEqual([1])
    expect(r.sns).toEqual(['GPON1A2B3C4D'])
  })

  it('mengembalikan kosong untuk teks tanpa ONU', () => {
    expect(parseExistingConfig('hello world')).toEqual({ used: {}, sns: [] })
  })
})
