# OLT Config Generator

Website untuk mengubah daftar pelanggan (**SN ONU + nama**) menjadi config registrasi ONU format `.cfg`, siap di-paste atau di-upload ke OLT. Semua proses berjalan di browser (tanpa backend dan database), jadi cukup di-deploy sebagai static site.

## Fitur

- Input satu per satu, tempel massal dari Excel (`SN, Nama, [PON], [ONU ID]`), atau upload CSV
- ONU ID otomatis per PON (auto-increment), bisa diisi manual
- Validasi: format SN (4 huruf + 8 hex, otomatis uppercase), SN duplikat, nama kosong, ONU ID bentrok, maksimal 128 ONU per PON
- Nama pelanggan disanitasi aman untuk CLI (spasi jadi `_`, simbol dibuang, maks 32 karakter)
- Template config bisa diedit (header / blok per pelanggan / footer) dengan placeholder
- Impor config OLT yang sudah berjalan: ONU ID terpakai dan SN terdaftar dikenali, penomoran dilanjutkan dari ID kosong
- Preview dengan syntax highlight, Copy, Download `.cfg` / `.txt`
- Riwayat generate (localStorage) + export / import JSON
- Dark mode (bawaan) dan light mode, responsif untuk mobile

## Template bawaan

```
configure terminal

interface gpon-olt_<SLOT>/<PON>
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
exit

end
write
```

`configure terminal` (header) dan `end` + `write` (footer) hanya ditulis **sekali**, sedangkan blok di tengah diulang untuk setiap pelanggan.

| Placeholder | Isi |
| --- | --- |
| `<SLOT>` | Slot (tab Parameter) |
| `<PON>` | PON port pelanggan (kolom PON, atau PON bawaan) |
| `<ONU_ID>` | ONU ID otomatis / manual |
| `<TYPE>` | Tipe ONU (tab Parameter) |
| `<SN>` | Serial number (uppercase) |
| `<CUSTOMER_NAME>` | Nama pelanggan yang sudah disanitasi |
| `<VLAN>` | VLAN (tab Parameter, bawaan 444) |
| `<SPEED>` | Kecepatan / nama profile (tab Parameter, bawaan 30M) |

> Tipe ONU bawaan adalah `ZTE-F609`. Ganti di tab **Parameter** sesuai tipe ONU yang terdaftar di OLT kamu. Profile `<SPEED>` (mis. `30M`) harus sudah ada di OLT.

## Contoh input

```
GPON1A2B3C4D,Budi Santoso
ZTEGC1234567,Siti Aminah
```

Hasilnya: ONU ID 1 dan 2 di PON 1, nama menjadi `Budi_Santoso` dan `Siti_Aminah`.

## Jalankan lokal

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit test parser & generator
npm run build      # hasil build di folder dist/
```

## Deploy di Dokploy

1. Push project ini ke repository Git (GitHub / GitLab / Gitea).
2. Di Dokploy: **Create Project**, lalu **Create Service → Application**.
3. Tab **General**: pilih provider Git dan repository + branch.
4. **Build Type** = `Dockerfile`, Docker File = `Dockerfile`, Docker Context Path = `.`
5. Tab **Domains**: tambah domain kamu, **Container Port = `80`**, aktifkan HTTPS dan pilih certificate Let's Encrypt. Arahkan DNS (record A) domain ke IP server Dokploy.
6. Klik **Deploy**. Healthcheck tersedia di `/healthz`.

(Nama menu bisa sedikit berbeda antar versi Dokploy.)

### Tanpa Dokploy (Docker biasa)

```bash
docker build -t olt-config-generator .
docker run -d -p 3000:80 --name olt-config-generator olt-config-generator
```

## Struktur

```
src/
  lib/          parser, generator, validasi, impor config, helper
  components/   panel UI (form, tabel, template, impor, riwayat, preview)
  App.tsx       layout dan state utama
Dockerfile      multi-stage: node build -> nginx static
nginx.conf      SPA fallback, cache aset, /healthz
```

## Catatan keamanan

- Data pelanggan hanya disimpan di localStorage browser, tidak dikirim ke server mana pun.
- Selalu uji config pada satu ONU sebelum dipakai ke OLT produksi, karena sintaks CLI bisa berbeda antar seri dan firmware.
