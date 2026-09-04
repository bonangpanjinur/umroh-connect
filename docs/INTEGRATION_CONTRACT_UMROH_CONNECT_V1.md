# Kontrak Integrasi Umroh Connect v1

**Status:** Baseline Fase 0 — Kontrak dan baseline  
**Tanggal:** 2026-09-04  
**Versi kontrak:** `1.0.0`

## 1. Tujuan dan batasan

Kontrak ini mengatur komunikasi server-to-server antara satu instalasi `sistem-travel-umroh` dan platform pusat `umroh-connect`.

Satu deployment `sistem-travel-umroh` merepresentasikan satu travel dan satu `tenant_id` pusat. Satu tenant dapat memiliki banyak cabang, agent, dan sub-agent. Pada v1, integrasi hanya mencakup profil publik travel, katalog paket, jadwal keberangkatan, ketersediaan kursi, dan lead. Booking operasional, pembayaran, dokumen jamaah, dan data sensitif tetap berada di sistem travel.

Umroh-connect tidak boleh membuka koneksi langsung ke database instalasi travel.

## 2. Identitas tenant dan instalasi

| Identitas | Pemilik | Keterangan |
|---|---|---|
| `tenant_id` | Umroh-connect | UUID tenant pusat; satu per travel |
| `installation_id` | Umroh-connect | UUID instalasi teknis yang terhubung ke tenant |
| `travel_id` | Sistem travel | UUID internal travel pada database lokal |
| `branch_id` | Sistem travel | Cabang di dalam satu tenant; bukan tenant baru |
| `central_id` | Umroh-connect | ID resource hasil mapping di pusat |
| `local_id` | Sistem travel | ID resource pada database lokal |

`tenant_id` tidak boleh dipercaya dari body request. Tenant ditentukan oleh credential instalasi yang terautentikasi, lalu resource lokal diverifikasi sebagai milik instalasi tersebut.

## 3. Environment dan domain

Setiap instalasi production wajib memiliki base URL HTTPS yang stabil, misalnya `https://rahmah.com`. Staging harus menggunakan credential dan tenant berbeda dari production.

Domain custom pada umroh-connect dipetakan berdasarkan hostname yang telah diverifikasi. Domain `rahmah.com` tidak boleh menampilkan katalog tenant lain.

## 4. Autentikasi server-to-server

Request integrasi memakai header berikut:

```text
X-Integration-Key: <key_id>
X-Integration-Timestamp: <unix_seconds>
X-Integration-Nonce: <unique_random_value>
X-Integration-Signature: <hex_hmac_sha256>
X-Request-Id: <uuid>
```

Signature dihitung dengan HMAC-SHA256 menggunakan secret instalasi. Canonical string:

```text
HTTP_METHOD + "\n" + REQUEST_PATH + "\n" + TIMESTAMP + "\n" + NONCE + "\n" + SHA256(REQUEST_BODY)
```

Credential hanya boleh disimpan di backend. Credential tidak boleh dikirim ke browser, disimpan di `localStorage`, diletakkan pada variable `VITE_*`, atau ditulis ke log.

Pusat wajib menolak request apabila signature salah, timestamp kedaluwarsa, nonce telah digunakan, credential dicabut, scope tidak sesuai, atau resource tidak cocok dengan instalasi.

Toleransi timestamp awal: 300 detik. Nonce minimal disimpan selama jangka toleransi tersebut. Semua request harus memiliki `X-Request-Id` untuk tracing.

## 5. Scope credential

| Scope | Hak |
|---|---|
| `catalog.write` | Mengirim profil, paket, keberangkatan, dan availability publik |
| `catalog.reconcile` | Mengirim snapshot rekonsiliasi |
| `lead.read` | Membaca lead yang ditujukan kepada travel |
| `lead.write` | Menerima lead dari pusat |
| `health.read` | Mengirim heartbeat dan membaca status integrasi |

Credential MVP dari sistem travel hanya membutuhkan `catalog.write`, `catalog.reconcile`, dan `health.read`. Scope lead ditambahkan ketika Fase 5 dimulai.

## 6. HTTP response envelope

Response sukses:

```json
{
  "data": {},
  "meta": {
    "request_id": "req_01JEXAMPLE",
    "idempotent": true
  }
}
```

Response error:

```json
{
  "error": {
    "code": "INVALID_SIGNATURE",
    "message": "Signature request tidak valid.",
    "request_id": "req_01JEXAMPLE",
    "retryable": false
  }
}
```

Kode HTTP dan sifat retry:

| HTTP | Kode contoh | Retry |
|---:|---|---|
| 400 | `INVALID_PAYLOAD`, `INVALID_EVENT` | Tidak |
| 401 | `INVALID_SIGNATURE`, `CREDENTIAL_REVOKED` | Tidak |
| 403 | `SCOPE_FORBIDDEN`, `TENANT_MISMATCH` | Tidak |
| 404 | `TENANT_NOT_FOUND`, `RESOURCE_NOT_FOUND` | Tidak |
| 409 | `EVENT_DUPLICATE`, `EVENT_VERSION_CONFLICT` | Tidak, proses sesuai response |
| 408/429 | `REQUEST_TIMEOUT`, `RATE_LIMITED` | Ya |
| 500/502/503/504 | `INTERNAL_ERROR`, `UPSTREAM_UNAVAILABLE` | Ya |

## 7. Idempotensi dan versioning

Setiap event wajib memiliki `event_id` global yang unik pada satu instalasi. Umroh-connect menyimpan kombinasi `(installation_id, event_id)` dan tidak boleh membuat perubahan kedua ketika event yang sama diterima ulang.

Setiap resource memiliki `entity_version` integer yang meningkat pada sistem sumber. Event dengan versi lebih rendah dari versi terakhir yang berhasil diproses tidak boleh menimpa data baru.

Untuk command atau request mutasi, gunakan header:

```text
Idempotency-Key: <8-128 characters>
```

Pengirim boleh melakukan retry hanya untuk timeout, rate limit, dan error server. Retry menggunakan exponential backoff dengan jitter dan batas percobaan.

## 8. Event katalog v1

Envelope standar:

```json
{
  "event_id": "evt_01JEXAMPLE",
  "event_type": "package.published",
  "event_version": 1,
  "occurred_at": "2026-09-04T10:00:00.000Z",
  "source": {
    "installation_id": "inst_01JEXAMPLE",
    "entity_type": "package",
    "entity_id": "local-package-uuid",
    "entity_version": 7
  },
  "data": {}
}
```

Event yang disepakati:

| Event | Sumber perubahan |
|---|---|
| `travel.profile.updated` | Profil publik travel berubah |
| `travel.published` | Travel mengaktifkan publikasi pusat |
| `travel.unpublished` | Travel menonaktifkan publikasi |
| `package.created` | Paket baru dibuat |
| `package.updated` | Paket berubah |
| `package.published` | Paket siap tampil |
| `package.unpublished` | Paket disembunyikan |
| `departure.created` | Keberangkatan baru dibuat |
| `departure.updated` | Jadwal, harga, atau detail berubah |
| `departure.cancelled` | Keberangkatan dibatalkan |
| `availability.updated` | Ketersediaan kursi berubah |

Payload katalog hanya boleh berisi field publik yang telah di-allowlist. Data paspor, dokumen jamaah, detail pembayaran, credential, dan field internal tidak boleh dikirim.

## 9. Endpoint pusat untuk MVP katalog

```text
POST /api/integrations/v1/events
POST /api/integrations/v1/reconciliation/snapshots
POST /api/integrations/v1/heartbeat
GET  /api/integrations/v1/installation/status
```

Endpoint `POST /api/integrations/v1/events` menerima satu envelope atau batch terbatas. Pusat mengembalikan `event_id`, status `accepted` atau `duplicate`, dan `request_id`.

## 10. Rekonsiliasi

Rekonsiliasi dilakukan minimal satu kali sehari dan dapat dipicu manual. Snapshot dikirim bertahap dengan pagination, cursor, checksum per batch, dan resource version.

Resource yang hilang dari snapshot tidak dihapus permanen. Pusat mengubah statusnya menjadi `unpublished` atau `archived` setelah aturan grace period terpenuhi.

## 11. Outbox lokal

Publisher tidak mengirim event langsung dari transaksi HTTP pengguna. Perubahan katalog harus menulis event ke outbox dalam transaksi yang sama dengan perubahan resource.

Status minimum outbox:

```text
pending → processing → sent
                   └→ retry → processing
                   └→ failed
```

Event `failed` harus dapat dilihat dan dikirim ulang oleh operator. Restart server tidak boleh menghilangkan event `pending` atau `retry`.

## 12. Heartbeat

Sistem travel mengirim heartbeat berkala dengan versi aplikasi, environment, waktu lokal server, dan statistik outbox tanpa payload sensitif.

```json
{
  "installation_id": "inst_01JEXAMPLE",
  "app_version": "2026.09.0",
  "environment": "production",
  "outbox_pending": 3,
  "outbox_failed": 0,
  "sent_at": "2026-09-04T10:00:00.000Z"
}
```

## 13. Checklist baseline Fase 0

- [ ] `tenant_id` pusat ditetapkan satu per deployment travel.
- [ ] Cabang, agent, dan sub-agent diperlakukan sebagai data internal tenant.
- [ ] `travel_id` lokal tidak disamakan dengan `tenant_id` pusat.
- [ ] Data katalog publik dan data sensitif telah dipisahkan.
- [ ] HMAC dan credential server-to-server telah disepakati.
- [ ] Event envelope, event name, version, dan idempotensi telah disepakati.
- [ ] Error code dan aturan retry telah disepakati.
- [ ] Outbox dan rekonsiliasi harian menjadi bagian desain sejak awal.
- [ ] Domain custom dipetakan ke tenant setelah verifikasi.
- [ ] Booking dan pembayaran tetap berada di sistem travel pada MVP.

## 14. Referensi repository

- [sistem-travel-umroh](https://github.com/bonangpanjinur/sistem-travel-umroh)
- [umroh-connect](https://github.com/bonangpanjinur/umroh-connect)
