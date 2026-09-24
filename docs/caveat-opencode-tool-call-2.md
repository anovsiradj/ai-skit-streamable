## Knowledge Base: Mengatasi Masalah Parallel Tool Calls pada Model Khusus di OpenCode## Ringkasan Masalah
Saat menggunakan model khusus (custom model) atau model lokal di dalam ekosistem OpenCode, Anda mungkin menemui pesan kesalahan seperti berikut:

invalid operation: This model only supports single tool-calls at once! (in tool_use:95)

Penyebab Utama: Sistem OpenCode secara bawaan (default) mencoba mengirimkan atau memformat instruksi untuk memanggil beberapa fungsi/alat sekaligus (parallel tool calls). Namun, arsitektur model khusus atau backend tertentu (seperti Ollama/Codestral) hanya mendukung satu panggilan alat dalam satu giliran (single tool-call).
## Solusi Pemecahan Masalah
Untuk menyelesaikan kendala ini, fitur parallel_tool_calls harus dinonaktifkan (False) agar sistem hanya mengizinkan panggilan single tool. Anda bisa menerapkannya melalui beberapa metode di bawah ini:
## Metode 1: Mengubah Konfigurasi API Request (Python SDK)
Jika aplikasi Anda memanggil model OpenCode menggunakan OpenAI-compatible client SDK di Python, tambahkan parameter parallel_tool_calls=False saat membuat chat completion.

from openai import OpenAI
client = OpenAI(base_url="http://localhost:11434/v1", api_key="opencode")
response = client.chat.completions.create(
    model="nama-model-khusus-anda",
    messages=[{"role": "user", "content": "Jalankan tugas analisis data"}],
    tools=[...],               # Daftar fungsi/tools Anda
    parallel_tool_calls=False  # <- WAJIB: Memaksa model hanya memanggil 1 tool
)

## Metode 2: Menggunakan Raw HTTP Request (JSON Payload)
Jika Anda berintegrasi menggunakan HTTP Client seperti cURL, Postman, atau backend kustom, pastikan properti "parallel_tool_calls": false disertakan di dalam struktur bodi request JSON.

{
  "model": "nama-model-khusus-anda",
  "messages": [
    {
      "role": "user",
      "content": "Periksa sisa kuota inventaris"
    }
  ],
  "tools": [...],
  "parallel_tool_calls": false
}

## Metode 3: Modifikasi Prompt Template pada Modelfile (Level Model)
Jika model khusus Anda dibangun atau dikustomisasi dari awal menggunakan konfigurasi Modelfile, bentrokan sering terjadi pada bagian TEMPLATE sistem.

   1. Buka berkas Modelfile milik model Anda.
   2. Periksa bagian penanganan parameter {{ .Tools }}.
   3. Ubah logika templat agar instruksi respon mengembalikan format JSON tunggal, alih-alih bentuk array/list majemuk yang memicu deteksi pemanggilan paralel oleh engine OpenCode.

## Metode 4: Pembatasan Jumlah Tools secara Mandiri
Sistem OpenCode terkadang melakukan fallback otomatis ke mode paralel apabila mendeteksi terlalu banyak opsi fungsi yang serupa.

* Praktik Terbaik: Hanya kirimkan skema alat (tool schema) yang benar-benar relevan dengan instruksi pengguna saat itu untuk memperkecil ruang kebingungan model.

------------------------------
## FAQ (Pertanyaan Sering Diajukan)

* Mengapa galat terjadi di file tool_use:95?
Ini dikarenakan skrip parser OpenCode mendeteksi adanya struktur data panggilan alat ganda yang tidak mampu diproses oleh token pengenal milik model khusus tersebut.
* Apakah performa model menurun jika parallel ditutup?
Tidak. Model tetap bekerja secara akurat, hanya saja proses eksekusi antar-tool akan berjalan secara sekuensial (bergantian), bukan bersamaan.
