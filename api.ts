import config, { resolveModelConfig } from "./config.ts";
import { saveChat } from "./chat.ts";

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

  // Terapkan shared config (modelsConfigs regexp + models exact) untuk
  // chat/completions: hanya mengisi key yang belum ada di payload client,
  // supaya agent tool yang kirim payload minimal tetap dapat default
  // (temperature, max_tokens, stream, ...). Body non-JSON diteruskan utuh.
  let outboundBody = requestBody;
  let requestModel: string | undefined;
  if (
    requestBody && !["GET", "HEAD"].includes(req.method) &&
    /(^|\/)chat\/completions$/.test(normalizedRoute)
  ) {
    try {
      const payload = JSON.parse(requestBody);
      if (payload && typeof payload.model === "string") {
        requestModel = payload.model;
        const defaults = resolveModelConfig(agentName, payload.model);
        let changed = false;
        for (const [key, value] of Object.entries(defaults)) {
          if (!(key in payload)) {
            payload[key] = value;
            changed = true;
          }
        }
        if (changed) outboundBody = JSON.stringify(payload);
      }
    } catch {
      // bukan JSON valid -> teruskan apa adanya
    }
  }
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
      body: outboundBody,
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

    void saveChat({
      timestamp: new Date().toISOString(),
      agent: agentName,
      model: requestModel,
      route: normalizedRoute,
      status: upstreamResponse.status,
      durationMs: Date.now() - start,
      requestText: requestBody,
    });

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

  if (url.pathname === "/") {
    return new Response("OK", {
      headers: { "content-type": "text/plain" },
    });
  }

  // Route contract: `/{agent}/{...segments}` — tanpa `/v1`, karena base URL
  // upstream sudah membawa prefix-nya sendiri (SSoT: config.agents[agent].url).
  const [agentName = "", ...segments] = url.pathname.split("/").filter(Boolean);
  if (!agentName) {
    return jsonError("Not found", 404);
  }

  return await proxyRequest(req, agentName, segments.join("/"));
}

if (import.meta.main) {
  Deno.serve({
    hostname: config.debug.host,
    port: Number(config.debug.port),
  }, handler);
}
