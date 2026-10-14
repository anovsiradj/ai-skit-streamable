// Facade shared untuk semua modul CLI. Satu-satunya tempat yang tahu cara
// bicara dengan local proxy (app.ts) dan cara membaca SSoT config.
//
// Modus coupling: tinggi di dalam (semua modul ambil dari sini), longgar di
// luar (modul hanya menerima ctx + memunculkan output).

import config from "../../config.ts";

export class CliError extends Error {}

export function proxyBase(): string {
  const host = config.debug.host ?? "localhost";
  const port = Number(config.debug.port ?? 8080);
  return `http://${host}:${port}`;
}

export function agentNames(): string[] {
  return Object.keys(config.agents).sort();
}

export function knownModels(agent: string): string[] {
  return Object.keys(config.agents[agent]?.models ?? {});
}

export function resolveAgent(flags: Record<string, string>): string {
  const name = flags.agent ?? config.debug.agent;
  if (!name) {
    throw new CliError(
      `agent belum ditentukan: pakai --agent <nama>, atau isi config.debug.agent. tersedia: ${
        agentNames().join(", ")
      }`,
    );
  }
  if (!config.agents[name]) {
    throw new CliError(
      `unknown agent "${name}". tersedia: ${agentNames().join(", ")}`,
    );
  }
  return name;
}

export function resolveModel(
  flags: Record<string, string>,
  fallback?: string,
): string {
  const name = flags.model ?? fallback ?? config.debug.model;
  if (!name) {
    throw new CliError(
      `model belum ditentukan: pakai --model <nama> atau isi config.debug.model`,
    );
  }
  return name;
}

// Pesan diambil dari positional args -> fallback debug.prompt.
export function promptFrom(positionals: string[]): string {
  const text = positionals.join(" ").trim();
  if (text) return text;
  const fallback = config.debug.prompt ?? "";
  if (fallback) return fallback;
  throw new CliError(
    "pesan kosong: tulis pesan setelah nama modul, atau isi config.debug.prompt",
  );
}

// Semua modul lewat proxy lokal supaya key upstream tetap di-inject app.ts —
// tidak ada duplikasi auth di sisi CLI.
export async function proxyFetch(
  route: string,
  init?: RequestInit,
): Promise<Response> {
  const url = `${proxyBase()}/${route}`;
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new CliError(
      `proxy tidak jalan di ${proxyBase()}? jalankan dulu: deno task app (${
        error instanceof Error ? error.message : String(error)
      })`,
    );
  }
}

export function proxyPost(payload: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  };
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
