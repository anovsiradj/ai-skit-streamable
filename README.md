# Agent Proxy Streamable

Proxy generik OpenAI-compatible untuk coding agent yang hanya support
stream/SSE, supaya bisa pakai upstream non-stream.

Request `/{agent}/v1/*` diteruskan ke `config.agents[agent].url` dengan injeksi
`Authorization: Bearer <key>`. Response upstream diteruskan verbatim (stream
maupun non-stream).

SSoT config: `config.ts` = merge `configDefaults.ts` + `configSecrets.ts`.

## Prasyarat

- Deno terinstall. Jangan pakai node/npm (lihat `AGENTS.md`).
- Duplikat `stub.configSecrets.ts` jadi `configSecrets.ts`, isi `key` per agent.
  File ini di-`.gitignore`, jadi aman untuk secret lokal.

## Task Deno

| Task  | Perintah                      | Fungsi                                                               |
| ----- | ----------------------------- | -------------------------------------------------------------------- |
| `app` | `deno task app`               | Jalankan local proxy di `debug.host:debug.port` (`main.ts`)          |
| `cli` | `deno task cli -- "<prompt>"` | Debug + ngetes proxy via chat langsung (`cli.ts`, butuh `app` jalan) |

## Tutorial

### 1. Jalankan proxy (terminal 1)

```bash
deno task app
# Listening on http://localhost:8080/
```

Cek sehat:

```bash
curl http://localhost:8080/
curl http://localhost:8080/api
```

### 2. Chat via CLI (terminal 2, proxy harus jalan)

Pakai prompt dari `config.debug.prompt`:

```bash
deno task cli
```

Pakai prompt custom dari argumen:

```bash
deno task cli -- "halo, siapa kamu?"
```

`cli.ts` membaca SSoT (`debug.agent/model/prompt/host/port` +
`agents[agent].models[model].config`), lalu `POST`
`http://{host}:{port}/{agent}/v1/chat/completions`. Contoh dengan default =
`POST http://localhost:8080/nvidia/v1/chat/completions`.

### 3. Pakai dari agent tool lain (curl)

Tanpa `key` di client — key disuntik proxy dari `configSecrets.ts`:

```bash
curl http://localhost:8080/nvidia/v1/chat/completions \
  -H "content-type: application/json" \
  -d '{"model":"deepseek-ai/deepseek-v4.1-flash","messages":[{"role":"user","content":"hello"}],"temperature":1,"top_p":0.95,"max_tokens":262144,"stream":false}'

curl http://localhost:8080/nvidia/v1/models
```

### 4. Pakai dari opencode/dsh/ etc

Arahkan `baseURL` OpenAI-compatible client ke proxy, per agent:

- opencode provider: `baseURL: http://localhost:8080/nvidia/v1`
- dsh / codex / copilot / tool lain: set endpoint yang sama,
  `model: deepseek-ai/deepseek-v4.1-flash`, `apiKey: apa-saja` (proxy yang
  mengganti dengan key asli).

### 5. Test

```bash
deno test --allow-net --allow-read --allow-env
```

Catatan: test proxy (`main_test.ts`) tidak pakai mocking — langsung hit upstream
asli sesuai `config.debug`, jadi butuh network + key valid dan bisa agak lama
(model non-stream berat).

## Links

<https://github.com/crashr/llama-stream>
<https://github.com/anomalyco/opencode/issues/785>
<https://opencode.ai/docs/config/> <https://opencode.ai/docs/providers/#config>
<https://github.com/deepseek-ai/deepseek-harness>
