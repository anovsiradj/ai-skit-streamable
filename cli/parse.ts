// Parser argumen CLI menggunakan built-in Deno Standard Library
// `parseArgs()` dari `@std/cli` (rekomendasi official docs.deno.com).
// Parser buatan sendiri diganti karena:
// - sudah diaudit Deno authors, mendukung `string`/`boolean`/`alias`/`--`
// - konsisten dengan panduan resmi parse command line arguments
//
// Adapter di sini menjaga antarmuka `TypeCliArgs` tetap stabil, sehingga
// modul (`chat.ts`, `model.ts`) dan `cli.ts` tidak perlu diubah.

import { parseArgs as stdParseArgs } from "@std/cli/parse-args";
import type { TypeCliArgs } from "./types.ts";

// `string` agar argumen seperti `--agent 8080` / `--model x/y` tetap string
// (default `parseArgs` mengonversi token bernada angka jadi number).
export function parseArgs(argv: string[]): TypeCliArgs {
  const parsed = stdParseArgs(argv, {
    string: ["agent", "model", "h", "help", "raw", "_", "port"],
  });

  // Semua flag dari std parser menjadi `flags` (kecuali -- dan _ yang
  // dipetakan ke positionals). Flag kosong / boolean murni => "true".
  const flags: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (key === "_" || key === "--") continue;
    if (key === "h" || key === "help") continue;
    flags[key] = value === "" ? "true" : String(value);
  }

  return {
    flags,
    positionals: parsed._.map(String).filter((p) => p !== "--"),
    help: parsed.help === "" || parsed.h === "",
  };
}
