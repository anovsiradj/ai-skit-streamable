import { assertEquals } from "@std/assert";
import { handler } from "./main.ts";

Deno.test("returns html on /", async () => {
  const res = handler(new Request("http://localhost/"));
  assertEquals(res.headers.get("content-type"), "text/html");
  const body = await res.text();
  assertEquals(body.includes("Welcome to Deno"), true);
});

Deno.test("returns json on /api", async () => {
  const res = handler(new Request("http://localhost/api"));
  const data = await res.json();
  assertEquals(data.message, "Hello, world!");
  assertEquals(typeof data.time, "string");
});

Deno.test("proxies requests through /{agent}/v1/{...segments} route", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; method: string; authorization?: string; body?: string }> = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers ?? {});
    calls.push({
      url,
      method: String(init?.method ?? "GET"),
      authorization: headers.get("Authorization") ?? undefined,
      body: init?.body ? String(init.body) : undefined,
    });

    return new Response(
      JSON.stringify({ id: "proxy-ok", object: "chat.completion" }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  };

  try {
    const res = await handler(
      new Request("http://localhost/nvidia/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-ai/deepseek-v4.1-flash",
          messages: [{ role: "user", content: "hi" }],
        }),
      }),
    );

    assertEquals(res.status, 200);
    assertEquals(calls.length, 1);
    assertEquals(calls[0].url, "https://integrate.api.nvidia.com/v1/chat/completions");
    assertEquals(calls[0].method, "POST");
    assertEquals(calls[0].authorization, "Bearer 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");

    const data = await res.json();
    assertEquals(data.id, "proxy-ok");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("returns 404 for unknown agent routes", async () => {
  const res = await handler(new Request("http://localhost/unknown/v1/models"));
  assertEquals(res.status, 404);

  const data = await res.json();
  assertEquals(data.error, "Unknown agent");
});
