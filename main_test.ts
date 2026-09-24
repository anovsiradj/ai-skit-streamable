import { assertEquals, assertExists } from "@std/assert";
import config from "./config.ts";
import { handler } from "./main.ts";

function baseUrlFromDebug(): string {
  const { host, port } = config.debug;
  assertExists(host, "config.debug.host missing");
  assertExists(port, "config.debug.port missing");
  return `http://${host}:${port}`;
}

Deno.test("returns html on /", async () => {
  const res = await handler(new Request(`${baseUrlFromDebug()}/`));
  assertEquals(res.headers.get("content-type"), "text/html");
  const body = await res.text();
  assertEquals(body.includes("Welcome to Deno"), true);
});

Deno.test("returns json on /api", async () => {
  const res = await handler(new Request(`${baseUrlFromDebug()}/api`));
  const data = await res.json();
  assertEquals(data.message, "Hello, world!");
  assertEquals(typeof data.time, "string");
});

Deno.test("proxies requests through /{agent}/v1/{...segments} route using real upstream (no mocking)", async (t) => {
  const { agent: expectedAgent, model: expectedModel, prompt: expectedPrompt } =
    config.debug;
  assertExists(expectedAgent, "config.debug.agent missing");
  assertExists(expectedModel, "config.debug.model missing");
  assertExists(expectedPrompt, "config.debug.prompt missing");

  const agentConfig = config.agents[expectedAgent];
  assertExists(agentConfig?.url, `config.agents[${expectedAgent}].url missing`);
  assertExists(agentConfig?.key, `config.agents[${expectedAgent}].key missing`);

  const modelConfig = agentConfig?.models?.[expectedModel]?.config ?? {};

  const res = await handler(
    new Request(`${baseUrlFromDebug()}/${expectedAgent}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: expectedModel,
        messages: [{ role: "user", content: expectedPrompt }],
        ...modelConfig,
      }),
    }),
  );

  assertEquals(res.status, 200);
  const data = await res.json();

  await t.step("response carries model id", () => {
    assertEquals(typeof data.model, "string");
  });

  await t.step("response carries non-empty assistant message", () => {
    const content = data.choices?.[0]?.message?.content;
    assertEquals(typeof content, "string");
    assertEquals(content.length > 0, true);
  });
});

Deno.test("returns 404 for unknown agent routes", async () => {
  const res = await handler(
    new Request(`${baseUrlFromDebug()}/unknown/v1/models`),
  );
  assertEquals(res.status, 404);

  const data = await res.json();
  assertEquals(data.error, "Unknown agent");
});
