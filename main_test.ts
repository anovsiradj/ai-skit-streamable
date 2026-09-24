import { assertEquals } from "@std/assert";
import config from "./config.ts";
import { handler } from "./main.ts";

Deno.test("returns html on /", async () => {
  const res = await handler(new Request("http://localhost/"));
  assertEquals(res.headers.get("content-type"), "text/html");
  const body = await res.text();
  assertEquals(body.includes("Welcome to Deno"), true);
});

Deno.test("returns json on /api", async () => {
  const res = await handler(new Request("http://localhost/api"));
  const data = await res.json();
  assertEquals(data.message, "Hello, world!");
  assertEquals(typeof data.time, "string");
});

Deno.test("proxies requests through /{agent}/v1/{...segments} route using real config and real payload", async () => {
  const expectedPrompt = config.debug.prompt ?? "hello";
  const expectedModel = config.debug.model ?? "deepseek-ai/deepseek-v4.1-flash";
  const expectedAgent = config.debug.agent ?? "nvidia";
  const expectedKey = config.agents[expectedAgent]?.key ?? "";

  const upstream = Deno.serve({
    hostname: "127.0.0.1",
    port: 0,
  }, async (req) => {
    const requestBody = await req.text();
    const payload = JSON.parse(requestBody);

    assertEquals(req.headers.get("Authorization"), `Bearer ${expectedKey}`);
    assertEquals(payload.model, expectedModel);
    assertEquals(payload.messages[0].role, "user");
    assertEquals(payload.messages[0].content, expectedPrompt);

    return Response.json({
      id: "proxy-ok",
      object: "chat.completion",
      model: payload.model,
    });
  });

  const port = (upstream.addr as Deno.NetAddr).port;
  const previousAgent = config.agents[expectedAgent];
  const previousDebug = { ...config.debug };

  config.debug = {
    ...config.debug,
    host: "127.0.0.1",
    port,
    agent: expectedAgent,
    model: expectedModel,
    prompt: expectedPrompt,
  };

  config.agents[expectedAgent] = {
    ...previousAgent,
    url: `http://127.0.0.1:${port}/v1`,
    key: expectedKey,
  };

  try {
    const res = await handler(
      new Request(`http://localhost/${expectedAgent}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: expectedModel,
          messages: [{ role: "user", content: expectedPrompt }],
        }),
      }),
    );

    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.id, "proxy-ok");
    assertEquals(data.model, expectedModel);
  } finally {
    config.agents[expectedAgent] = previousAgent;
    config.debug = previousDebug;
    await upstream.shutdown();
  }
});

Deno.test("returns 404 for unknown agent routes", async () => {
  const res = await handler(new Request("http://localhost/unknown/v1/models"));
  assertEquals(res.status, 404);

  const data = await res.json();
  assertEquals(data.error, "Unknown agent");
});
