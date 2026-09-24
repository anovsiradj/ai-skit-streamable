import config from "./config.ts";

// cli untuk debug + ngetes local proxy secara langsung.
// pakai SSoT dari config.debug + config.agents, jadi sasarannya generik:
// opencode, dsh (deepseek-harness), codex, copilot, agent tool lainnya.
// contoh: deno task cli -- "halo, siapa kamu?"

const agent = config.debug.agent!;
const model = config.debug.model!;
const promptFromArgs = Deno.args.join(" ").trim();
const prompt = promptFromArgs || config.debug.prompt;
const host = config.debug.host ?? "localhost";
const port = Number(config.debug.port!);

const agentConfig = config.agents[agent];
if (!agentConfig?.url) {
  console.error(`[cli] unknown agent or missing url: ${agent}`);
  Deno.exit(1);
}

const modelConfig = agentConfig.models?.[model]?.config ?? {};
const proxyUrl = `http://${host}:${port}/${agent}/v1/chat/completions`;

const payload = {
  model,
  messages: [{ role: "user", content: prompt }],
  ...modelConfig,
};

console.log(`[cli] POST ${proxyUrl}`);
console.log(`[cli] model=${model} prompt=${JSON.stringify(prompt)}`);

let res: Response;
try {
  res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
} catch (error) {
  console.error(
    `[cli] proxy tidak jalan di ${host}:${port}? jalankan dulu: deno task app`,
    error instanceof Error ? error.message : String(error),
  );
  Deno.exit(1);
}

console.log(`[cli] status=${res.status}`);

const text = await res.text();
if (!res.ok) {
  console.error(`[cli] error body: ${text}`);
  Deno.exit(1);
}

try {
  const data = JSON.parse(text);
  const content = data.choices?.[0]?.message?.content ??
    data.choices?.[0]?.delta?.content ??
    JSON.stringify(data, null, 2);
  console.log(`[cli] --- reply ---`);
  console.log(
    typeof content === "string" ? content : JSON.stringify(content, null, 2),
  );
} catch {
  console.log(text);
}
