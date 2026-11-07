import type { Params, Templates } from './types'

export const DEFAULT_PARAMS: Params = {
  slot: 1,
  pon: 1,
  onuType: 'ZTE-F609',
  vlan: 444,
  speed: '30M',
  startOnuId: 1,
}

/**
 * Template bawaan (dari config OLT pengguna).
 * Placeholder: <SLOT> <PON> <ONU_ID> <TYPE> <SN> <CUSTOMER_NAME> <VLAN> <SPEED>
 * - header : ditulis sekali di awal
 * - block  : diulang untuk setiap pelanggan
 * - footer : ditulis sekali di akhir
 */
export const DEFAULT_TEMPLATES: Templates = {
  header: `configure terminal`,
  block: `interface gpon-olt_<SLOT>/<PON>
onu <ONU_ID> type <TYPE> sn <SN>
exit

interface gpon-onu_<SLOT>/<PON>:<ONU_ID>
name <CUSTOMER_NAME>
sn-bind enable sn
tcont 1 profile <SPEED>
gemport 1 name Internet tcont 1
gemport 1 traffic-limit upstream <SPEED> downstream <SPEED>
encrypt 1 enable downstream
service-port 1 vport 1 user-vlan <VLAN> vlan <VLAN>
service-port 1 description PPPoE
exit

pon-onu-mng gpon-onu_<SLOT>/<PON>:<ONU_ID>
service Internet gemport 1 vlan <VLAN>
vlan port veip_1 mode hybrid
vlan port veip_1 vlan <VLAN>
security-mgmt 1 state enable mode forward protocol web http
interface wifi wifi_0/1 state unlock
exit`,
  footer: `end
write`,
}

export const PLACEHOLDERS: { token: string; desc: string }[] = [
  { token: '<SLOT>', desc: 'Nomor slot (parameter)' },
  { token: '<PON>', desc: 'Nomor PON port pelanggan' },
  { token: '<ONU_ID>', desc: 'ONU ID (otomatis / manual)' },
  { token: '<TYPE>', desc: 'Tipe ONU (parameter)' },
  { token: '<SN>', desc: 'Serial number ONU' },
  { token: '<CUSTOMER_NAME>', desc: 'Nama pelanggan (sudah disanitasi)' },
  { token: '<VLAN>', desc: 'VLAN (parameter)' },
  { token: '<SPEED>', desc: 'Kecepatan / nama profile (parameter)' },
]
