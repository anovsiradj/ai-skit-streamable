import config from "./config.ts";

function jsonError(message: string, status = 400): Response {
  return Response.json(
    {
      error: message,
    },
    {
      status,
    },
  );
}

async function proxyRequest(
  req: Request,
  agentName: string,
  route: string,
): Promise<Response> {
  const agentConfig = config.agents[agentName];

  if (!agentConfig) {
    return jsonError("Unknown agent", 404);
  }

  const baseUrl = (agentConfig.url ?? "").replace(/\/+$/, "");
  if (!baseUrl) {
    return jsonError("Agent URL not configured", 500);
  }

  const url = new URL(req.url);
  const upstreamUrl = new URL(baseUrl);
  const normalizedRoute = route.replace(/^\/+|\/+$/g, "");
  if (normalizedRoute) {
    upstreamUrl.pathname = `${
      upstreamUrl.pathname.replace(/\/+$/, "")
    }/${normalizedRoute}`;
  }
  if (url.search) {
    upstreamUrl.search = url.search;
  }

  const start = Date.now();
  const requestBody = ["GET", "HEAD"].includes(req.method)
    ? undefined
    : await req.text();
  const headers = new Headers();
  for (const [key, value] of req.headers.entries()) {
    const lowerKey = key.toLowerCase();
    const blocked = [
      "host",
      "content-length",
      "connection",
      "keep-alive",
      "transfer-encoding",
      "upgrade",
      "proxy-connection",
    ];

    if (!blocked.includes(lowerKey)) {
      headers.set(key, value);
    }
  }

  if (agentConfig.key) {
    headers.set("Authorization", `Bearer ${agentConfig.key}`);
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "proxy_request",
      agent: agentName,
      method: req.method,
      path: url.pathname,
      upstream: upstreamUrl.toString(),
    }),
  );

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: requestBody,
    });

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "proxy_response",
        agent: agentName,
        status: upstreamResponse.status,
        durationMs: Date.now() - start,
      }),
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: "proxy_error",
        agent: agentName,
        message: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      }),
    );

    return jsonError("Upstream request failed", 502);
  }
}

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api") {
    return Response.json({
      message: "Hello, world!",
      time: new Date().toISOString(),
    });
  }

  if (url.pathname === "/") {
    return new Response("<h1>Welcome to Deno!</h1>", {
      headers: { "content-type": "text/html" },
    });
  }

  const match = url.pathname.match(/^\/([^/]+)\/v1(?:\/(.*))?$/);
  if (!match) {
    return jsonError("Not found", 404);
  }

  const [, agentName, route = ""] = match;
  return await proxyRequest(req, agentName, route);
}

if (import.meta.main) {
  Deno.serve({
    hostname: config.debug.host,
    port: Number(config.debug.port),
  }, handler);
}
