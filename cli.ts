// Facade CLI modular: parse argumen sekali, lalu teruskan ke modul yang
// dipilih. Menambah modul = tambah satu file di `cli/modules/` + daftarkan
// di `modules` di bawah, tanpa sentuh parser maupun modul lain.
//
// Cara lama `deno task cli -- "halo"` tetap jalan: tanpa nama modul,
// positional dianggap pesan untuk modul `chat` (backward compatible).
// Nama modul ber-namespace yang tidak dikenal (`foo:bar`) dianggap salah
// ketik, dan akan ditolak.

import { CliError } from "./src/cli/core.ts";
import { chatModule } from "./src/cli/modules/chat.ts";
import { modelInfoModule, modelListModule } from "./src/cli/modules/model.ts";
import { parseArgs } from "./src/cli/parse.ts";
import type { TypeCliModule } from "./src/cli/types.ts";

const modules: TypeCliModule[] = [
  chatModule,
  modelListModule,
  modelInfoModule,
];

function printModules(): void {
  console.log("cli untuk proxy streamable.\n");
  console.log("modul:");
  for (const mod of modules) {
    console.log(`  ${mod.name.padEnd(12)} ${mod.summary}`);
  }
  console.log("\nflag umum: --agent <nama>  --model <nama>");
  console.log("default agent/model diambil dari config.debug.*");
  console.log("\nproxy harus jalan dulu: deno task app");
}

function printModule(mod: TypeCliModule): void {
  console.log(`${mod.name} - ${mod.summary}`);
  console.log(`usage: ${mod.usage}`);
}

const args = parseArgs(Deno.args);

if (args.help || args.positionals[0] === "help") {
  printModules();
  Deno.exit(0);
}

const requested = args.positionals[0];
const selected = requested
  ? modules.find((mod) => mod.name === requested)
  : undefined;

if (requested && !selected && requested.includes(":")) {
  console.error(`[cli] unknown module: ${requested}\n`);
  printModules();
  Deno.exit(1);
}

const active = selected ?? chatModule;
const context = {
  args: {
    ...args,
    positionals: selected ? args.positionals.slice(1) : args.positionals,
  },
};

try {
  const code = await active.run(context);
  Deno.exit(typeof code === "number" ? code : 0);
} catch (error) {
  if (error instanceof CliError) {
    console.error(`[cli] ${error.message}`);
    console.error(`[cli] usage: ${active.usage}`);
  } else {
    console.error(`[cli] error:`, error);
  }
  Deno.exit(1);
}
