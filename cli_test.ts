import { assertEquals } from "@std/assert";
import { parseArgs } from "./src/cli/parse.ts";
import type { TypeCliArgs } from "./src/cli/types.ts";

const expect = (name: string, got: TypeCliArgs): void =>
  assertEquals(got, got satisfies TypeCliArgs, name);

Deno.test("parser std: --agent --model value", () => {
  assertEquals(
    parseArgs(["--agent", "nvidia", "--model", "openai/gpt-oss-20b"]),
    {
      flags: { agent: "nvidia", model: "openai/gpt-oss-20b" },
      positionals: [],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: positional = pesan (chat shortcut)", () => {
  assertEquals(
    parseArgs(["hello", "dunia"]),
    {
      flags: {},
      positionals: ["hello", "dunia"],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: module command", () => {
  assertEquals(
    parseArgs(["model:list"]),
    {
      flags: {},
      positionals: ["model:list"],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: --key=value", () => {
  assertEquals(
    parseArgs(["--agent=nvidia"]),
    {
      flags: { agent: "nvidia" },
      positionals: [],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: -- di depan = stop-parsing", () => {
  assertEquals(
    parseArgs(["--", "pesan", "setelah", "--"]),
    {
      flags: {},
      positionals: ["pesan", "setelah"],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: --help", () => {
  assertEquals(
    parseArgs(["--help"]),
    { flags: {}, positionals: [], help: true } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: -h", () => {
  assertEquals(
    parseArgs(["-h"]),
    { flags: {}, positionals: [], help: true } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: token bernada angka tetap string", () => {
  assertEquals(
    parseArgs(["--agent", "11434"]),
    { flags: { agent: "11434" }, positionals: [], help: false } satisfies
      TypeCliArgs,
  );
  assertEquals(
    parseArgs(["--port", "8080", "pesan"]),
    {
      flags: { port: "8080" },
      positionals: ["pesan"],
      help: false,
    } satisfies TypeCliArgs,
  );
});

Deno.test("parser std: --raw = true", () => {
  assertEquals(
    parseArgs(["--raw"]),
    { flags: { raw: "true" }, positionals: [], help: false } satisfies
      TypeCliArgs,
  );
});

Deno.test("parser std: module + flags + pesan", () => {
  assertEquals(
    parseArgs(["model:info", "--agent", "nvidia", "--model", "z-ai/glm-5.3"]),
    {
      flags: { agent: "nvidia", model: "z-ai/glm-5.3" },
      positionals: ["model:info"],
      help: false,
    } satisfies TypeCliArgs,
  );
});
