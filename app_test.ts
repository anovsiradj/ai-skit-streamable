import { assertEquals, assertExists } from "@std/assert";
import config, { resolveModelConfig } from "./config.ts";
import { handler } from "./app.ts";

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

// Test ini hit upstream asli (tanpa mocking) jadi butuh izin net.
// `deno test` polos otomatis skip test ini; run lengkap dengan:
// deno test --allow-net --allow-read --allow-env
const netAccess = await Deno.permissions.query({
  name: "net",
  host: "integrate.api.nvidia.com",
});

Deno.test({
  name:
    "proxies requests through /{agent}/{...segments} route using real upstream (no mocking)",
  ignore: netAccess.state !== "granted",
  fn: async (t) => {
    const {
      agent: expectedAgent,
      model: expectedModel,
      prompt: expectedPrompt,
    } = config.debug;
    assertExists(expectedAgent, "config.debug.agent missing");
    assertExists(expectedModel, "config.debug.model missing");
    assertExists(expectedPrompt, "config.debug.prompt missing");

    const agentConfig = config.agents[expectedAgent];
    assertExists(
      agentConfig?.url,
      `config.agents[${expectedAgent}].url missing`,
    );
    assertExists(
      agentConfig?.key,
      `config.agents[${expectedAgent}].key missing`,
    );

    const modelConfig = resolveModelConfig(expectedAgent, expectedModel);

    const res = await handler(
      new Request(
        `${baseUrlFromDebug()}/${expectedAgent}/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: expectedModel,
            messages: [{ role: "user", content: expectedPrompt }],
            ...modelConfig,
          }),
        },
      ),
    );

    if (res.status !== 200) {
      const body = await res.text();
      throw new Error(
        `proxy ke upstream gagal (HTTP ${res.status}): ${body}`,
      );
    }
    const data = await res.json();

    await t.step("response carries model id", () => {
      assertEquals(typeof data.model, "string");
    });

    await t.step("response carries non-empty assistant message", () => {
      const content = data.choices?.[0]?.message?.content;
      assertEquals(typeof content, "string");
      assertEquals(content.length > 0, true);
    });
  },
});

Deno.test("returns 404 for unknown agent routes", async () => {
  const res = await handler(
    new Request(`${baseUrlFromDebug()}/unknown/models`),
  );
  assertEquals(res.status, 404);

  const data = await res.json();
  assertEquals(data.error, "Unknown agent");
});
