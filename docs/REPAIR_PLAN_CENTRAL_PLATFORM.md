# Rencana Perbaikan `umroh-connect`

## Tujuan

Repository `umroh-connect` harus menjadi **platform pusat `arahumroh.id`**. Satu tenant pusat mewakili satu travel, misalnya Jannah. Cabang dan agen bukan tenant baru di platform pusat; keduanya hanya metadata organisasi dan channel distribusi yang dikelola oleh instalasi travel masing-masing.

Platform pusat bertanggung jawab atas tenant registry, instalasi, katalog publik pusat, lead intake, delivery ke travel, dan observability. Detail cabang, agen, user admin, dokumen, perlengkapan, serta pembayaran tetap dimiliki sistem travel.

## Prinsip desain yang wajib dipertahankan

| Prinsip | Keputusan |
|---|---|
| Tenant pusat | Satu `platform_tenant` = satu travel pusat. |
| Instalasi | Satu `tenant_installation` = satu deployment sistem travel. |
| Katalog | Produk dikelola oleh travel pusat dan dipublikasikan sebagai read model pusat. |
| Website | Website cabang/agen bukan tenant platform; konteksnya diteruskan sebagai metadata channel. |
| Lead | Pusat menerima lead, menyimpan atribusi sumber, lalu mengirimkannya ke satu installation travel. |
| Data sensitif | NIK, dokumen, perlengkapan, dan pembayaran tidak disimpan di pusat kecuali kebutuhan minimum yang disepakati. |
| Scope admin | Admin platform mengelola tenant/platform; admin travel beroperasi di sistem travel. |

## Tahap 1 — Model tenant dan channel registry

### Perubahan

Tambahkan registry channel opsional di bawah `tenant_registry`, bukan membuat tenant baru untuk setiap cabang/agen.

```text
central_tenant
└── tenant_channels
    ├── channel_type: central
    ├── channel_type: branch
    └── channel_type: agent
```

Kolom yang disarankan:

```text
id
tenant_id
installation_id
public_key
channel_type
source_branch_id
source_agent_id
domain
status
metadata
created_at
updated_at
```

`source_branch_id` dan `source_agent_id` diperlakukan sebagai opaque identifier milik travel. Platform tidak membuat foreign key lintas database.

### Kriteria selesai

Satu travel dapat memiliki banyak channel, seluruh channel tetap terkait ke satu `tenant_id`, domain channel unik, dan channel disabled tidak dapat dipakai untuk intake lead baru.

## Tahap 2 — Katalog read model pusat

### Perubahan

Pertahankan satu katalog per tenant. Tambahkan batasan bahwa produk tidak memiliki copy terpisah per cabang atau agen. Resource mapping harus membedakan:

```text
central_product_id
source_installation_id
source_local_product_id
source_version
```

Semua website channel tenant membaca produk dengan filter:

```text
tenant_id = current_tenant
is_published = true
```

### Kriteria selesai

Event katalog dari satu installation tidak dapat menulis produk tenant lain. Event versi lama diabaikan. Delete atau unpublish dari travel tercermin sebagai produk nonaktif di pusat.

## Tahap 3 — Lead intake dengan atribusi channel

### Perubahan

Perluas `central_leads` dengan metadata berikut:

```text
source_channel_id
channel_type
source_branch_id
source_agent_id
landing_domain
landing_path
utm_source
utm_medium
utm_campaign
```

Frontend tidak boleh mengirim `tenant_id`, `branch_id`, `agent_id`, atau `pic_user_id` sebagai sumber kebenaran. Backend melakukan resolusi dari domain/channel registry yang sudah diverifikasi.

Payload internal pusat:

```json
{
  "tenant_id": "tenant-jannah",
  "source_channel_id": "channel-jannah-agent-a",
  "channel_type": "agent",
  "source_branch_id": "branch-a",
  "source_agent_id": "agent-a",
  "product_id": "central-product-1",
  "full_name": "Contoh Pendaftar",
  "phone": "+6281111111111"
}
```

### Kriteria selesai

Duplicate intake ditolak secara idempotent, channel nonaktif ditolak, product harus berasal dari tenant yang sama, dan lead hanya dibuatkan satu delivery ke installation production tenant tersebut.

## Tahap 4 — Delivery dan reliability

### Perubahan

Pertahankan HMAC, nonce, scope credential, claim timeout, dan acknowledgement idempotent. Tambahkan audit event untuk:

```text
lead.received
lead.routed
delivery.claimed
delivery.claim_timeout
delivery.accepted
delivery.rejected
delivery.manual_retry
```

Metrics minimum:

```text
lead_total
lead_by_channel
delivery_backlog
delivery_dead_letter
installation_last_heartbeat
routing_error_count
signature_error_count
```

### Kriteria selesai

Delivery tidak macet permanen setelah worker crash, retry tidak menggandakan lead, dan dashboard dapat memisahkan statistik berdasarkan tenant serta channel.

## Tahap 5 — Admin platform dan observability

### Perubahan UI

Tambahkan halaman admin:

```text
Tenant → Installation → Channel Registry
Tenant → Catalog Snapshot
Tenant → Lead Attribution
Tenant → Delivery Health
```

Admin platform boleh mengelola registry tenant dan installation, tetapi tidak boleh melihat dokumen, pembayaran, atau detail operasional sensitif dari sistem travel.

### Kriteria selesai

Admin dapat melihat channel aktif/nonaktif, asal lead, status delivery, retry, dan installation health tanpa mencampur data antar-tenant.

## Tahap 6 — Kontrak integrasi

Perbarui `docs/INTEGRATION_CONTRACT_UMROH_CONNECT_V1.md` dengan field:

```text
source_channel_id
channel_type
source_branch_id
source_agent_id
landing_domain
landing_path
utm_source
utm_medium
utm_campaign
```

Tambahkan aturan bahwa `pic_user_id` final ditentukan oleh sistem travel. Pusat hanya mengirim metadata channel dan opaque references.

## Tahap 7 — Test plan

Test minimum yang harus ditambahkan:

| Skenario | Expected |
|---|---|
| Website pusat mengirim lead | Lead masuk ke tenant travel dengan `channel_type=central`. |
| Website cabang mengirim lead | Lead masuk ke tenant sama dengan `source_branch_id`. |
| Website agen mengirim lead | Lead masuk ke tenant sama dengan `source_agent_id`. |
| Channel disabled mengirim lead | Ditolak dengan `CHANNEL_DISABLED`. |
| Product tenant lain dikirim | Ditolak dengan `PRODUCT_TENANT_MISMATCH`. |
| Duplicate idempotency key | Mengembalikan lead lama tanpa insert kedua. |
| Worker crash setelah claim | Delivery direqueue setelah timeout. |
| Ack dikirim dua kali | Request kedua bersifat idempotent. |
| Credential tanpa scope lead | Ditolak 403. |
| Admin tenant A meminta data tenant B | Tidak ada data yang bocor. |

## Urutan implementasi repository

1. Tambahkan migration channel registry.
2. Tambahkan resolver domain/channel pada lead routing.
3. Tambahkan field atribusi pada central lead dan delivery payload.
4. Tambahkan per-channel metrics dan audit.
5. Perbarui dashboard admin.
6. Perbarui kontrak integrasi.
7. Tambahkan test contract dan smoke test channel pusat/cabang/agen.
8. Jalankan typecheck, lint, migration check, build, dan review RLS.

## Definition of Done

Rencana ini dianggap selesai setelah `umroh-connect` dapat menerima beberapa channel untuk satu tenant travel, seluruh channel memakai katalog tenant yang sama, setiap lead menyimpan sumber channel secara immutable, delivery menuju installation travel tetap idempotent, dan tidak ada cabang/agen yang terdaftar sebagai tenant pusat baru.
