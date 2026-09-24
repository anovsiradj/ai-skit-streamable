# Knowledge Base: Mengatasi Timeout OpenCode pada API Non-Streaming (Tanpa SSE)

## Masalah (Symptom)
Saat menggunakan **OpenCode AI coding agent** dengan API kustom atau LLM provider pihak ketiga, agen mengalami **Keep-Alive Timeout** atau **Chunk Timeout**. 

Hal ini terjadi karena OpenCode secara bawaan (*native*) mengekspektasikan respons berbasis **Streaming (Server-Sent Events / SSE)**. Jika API tujuan Anda tidak mendukung streaming dan mengembalikan seluruh jawaban dalam satu paket JSON besar (non-streaming), *watchdog timer* pada OpenCode akan mengira koneksi terputus/beku karena tidak ada pecahan data (*chunks*) yang masuk, lalu memutus koneksi secara paksa.

## Batasan Sistem OpenCode
Di dalam OpenCode, konfigurasi koneksi jaringan seperti `timeout`, `headerTimeout`, dan `chunkTimeout` **hanya bisa diatur di tingkat Provider**, bukan per model individual. Model yang berada di dalam provider yang sama akan mewarisi aturan koneksi yang sama.

---

## Solusi 1: Mematikan Watchdog Timeout di `opencode.json` (Jika Semua Model Non-Stream)

Jika semua model dari provider tersebut bersifat non-streaming, Anda cukup mematikan fungsi *chunk timeout* secara global pada konfigurasi provider tersebut.

### Langkah-langkah:
1. Buka file konfigurasi **`opencode.json`** Anda.
2. Temukan blok `provider` yang bermasalah.
3. Tambahkan properti `timeout`, `headerTimeout`, dan `chunkTimeout` lalu set nilainya menjadi `false` di dalam objek `options`.

### Contoh Konfigurasi:
```json
{
  "$schema": "https://opencode.ai",
  "provider": {
    "my-custom-api": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://endpointanda.com",
        "apiKey": "your-api-key",
        "timeout": false,
        "headerTimeout": false,
        "chunkTimeout": false
      }
    }
  }
}
```
* **`chunkTimeout: false`**: Memerintahkan OpenCode untuk tidak memutus koneksi meskipun tidak ada pecahan data streaming yang masuk terus-menerus.
* **`timeout: false`**: Memastikan OpenCode bersedia menunggu secara asinkron hingga API selesai memproses seluruh teks dan mengembalikan JSON utuh.

---

## Solusi 2: Solusi Hibrida (Memisahkan Provider untuk Model Streaming & Non-Streaming)

Jika Anda memiliki satu platform/URL API yang sama, namun berisi campuran model (ada model yang mendukung streaming cepat, dan ada model berat yang terpaksa non-streaming), gunakan strategi **Split Provider**.

Buat dua entitas provider berbeda di `opencode.json` yang mengarah ke URL dan API Key yang sama, namun dengan aturan *timeout* yang berbeda.

### Contoh Konfigurasi Hibrida:
```json
{
  "$schema": "https://opencode.ai",
  "provider": {
    "api-streaming-cepat": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://endpointanda.com",
        "apiKey": "your-api-key"
      },
      "models": {
        "model-kilat": { "name": "Standard Streaming Model" }
      }
    },
    "api-non-streaming-berat": {
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "https://endpointanda.com",
        "apiKey": "your-api-key",
        "timeout": false,
        "headerTimeout": false,
        "chunkTimeout": false
      },
      "models": {
        "model-prosesor-besar": { "name": "Heavy Non-Streaming Model" }
      }
    }
  }
}
```

## Catatan Tambahan (Troubleshooting)
Setelah menerapkan konfigurasi di atas, OpenCode akan dengan sabar menunggu respons dari API Anda tanpa *timeout*. Namun, jika setelah proses tunggu selesai muncul **Parsing Error / Format Error**, hal itu menandakan OpenCode kesulitan membaca struktur JSON final karena mengharapkan objek berupa token delta (`choices[0].delta`). 

Jika hal itu terjadi, disarankan untuk memasang *middleware proxy* ringan (seperti skrip FastAPI atau Node.js 15 baris) di tengah-tengah untuk mengubah struktur JSON standar menjadi format pecahan tiruan (*mocked chunks*).
