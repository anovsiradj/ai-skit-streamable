# Agent Proxy Streamable

Proxy generik OpenAI-compatible untuk coding agent yang hanya support
stream/SSE, supaya bisa pakai upstream non-stream.

Request `/{agent}/*` diteruskan ke `config.agents[agent].url` dengan injeksi
`Authorization: Bearer <key>`. Response upstream diteruskan verbatim (stream
maupun non-stream).

SSoT config: `config.ts` = merge `configDefaults.ts` + `configSecrets.ts`.

## Task Deno

Lihat `deno.json` untuk daftar task yang tersedia.

## Tutorial

### 1. Jalankan proxy (terminal 1)

```bash
deno task api
# Listening on http://localhost:8080/
```

Cek sehat:

```bash
curl http://localhost:8080/
curl http://localhost:8080/api
```

### 2. CLI modular (terminal 2, proxy harus jalan)

`cli.ts` adalah facade: parse argumen sekali, lalu teruskan ke modul yang
dipilih. Menambah modul = tambah satu file di `cli/modules/` + daftarkan di
`modules` (tanpa sentuh parser maupun modul lain).

| Modul        | Perintah                                                          | Fungsi                                                 |
| ------------ | ----------------------------------------------------------------- | ------------------------------------------------------ |
| `chat`       | `deno task cli chat [--agent <nama>] [--model <nama>] [pesan...]` | debug chat, `POST {base}/{agent}/chat/completions`     |
| `model:list` | `deno task cli model:list [--agent <nama>] [--raw]`               | `GET {base}/{agent}/models`, `*` = terdaftar di config |
| `model:info` | `deno task cli model:info <model> [--agent <nama>]`               | config ter-resolve (lokal, tanpa network)              |

Default `agent`/`model` diambil dari `config.debug.*`; pesan fallback dari
`config.debug.prompt`. Contoh:

```bash
deno task cli chat
deno task cli chat --agent nvidia --model openai/gpt-oss-20b "halo, siapa kamu?"
deno task cli model:list
deno task cli model:info openai/gpt-oss-20b
```

Cara lama `deno task cli -- "halo"` tetap jalan sebagai shortcut `chat`. Prefix
`/v1` ada di `agents[agent].url`, bukan di path proxy.

### 3. Pakai dari agent tool lain (curl)

Tanpa `key` di client — key disuntik proxy dari `configSecrets.ts`:

```bash
curl http://localhost:8080/nvidia/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"deepseek-ai/deepseek-v4.1-flash","messages":[{"role":"user","content":"hello"}],"temperature":1,"top_p":0.95,"max_tokens":262144,"stream":false}'

curl http://localhost:8080/nvidia/models
```

### 4. Pakai dari opencode/dsh/ etc

Arahkan `baseURL` OpenAI-compatible client ke proxy, per agent:

- opencode provider: `baseURL: http://localhost:8080/nvidia`
- dsh / codex / copilot / tool lain: set endpoint yang sama,
  `model: deepseek-ai/deepseek-v4.1-flash`, `apiKey: apa-saja` (proxy yang
  mengganti dengan key asli).

### 5. Shared config model (`modelsConfigs`)

Key di `agents[<nama>].modelsConfigs` adalah string regexp yang dicocokkan ke
nama model — cocok untuk keluarga model yang berbagi parameter (contoh:
`"^(meta|poolside)/"`, `"^z-ai/"`). Resolusi via `resolveModelConfig()` di
`config.ts`: base dari regexp yang cocok (urutan insert = prioritas) lalu
ditimpa per-key oleh `models[<nama>].config` exact bila ada.

Proxy otomatis mengisi parameter yang belum ada di payload client
(`chat/completions`), jadi agent tool yang kirim payload minimal (cuma `model` +
`messages`) tetap dapat default yang benar.

### 6. Pencatatan chat (`is_save_chat`)

`debug.is_save_chat` adalah toggle logging input/output. Untuk sekarang
`saveChat()` di `chat.ts` masih placeholder (cuma `console.debug` metadata +
request, tanpa isi response karena body upstream berupa stream). Rencana:
persist ke sqlite.

### 7. Test

```bash
deno test --allow-net --allow-read --allow-env
```

Catatan: test proxy (`app_test.ts`) tidak pakai mocking — langsung hit upstream
asli sesuai `config.debug`, jadi butuh network + key valid dan bisa agak lama
(model non-stream berat).

## Links

<https://github.com/crashr/llama-stream>
<https://github.com/anomalyco/opencode/issues/785>
<https://opencode.ai/docs/config/> <https://opencode.ai/docs/providers/#config>
<https://github.com/deepseek-ai/deepseek-harness>

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
