// Tipe SSoT untuk modul CLI.

export interface TypeCliArgs {
  flags: Record<string, string>;
  positionals: string[];
  help: boolean;
}

export interface TypeCliContext {
  args: TypeCliArgs;
}

// Modul CLI: objek yang membawa nama + cara jalan. Menambah modul CLI baru
// tidak perlu sentuh parser maupun modul lain (polymorfisme + anti-pattern:
// satu interface, daftar terbuka di `modules`).
export interface TypeCliModule {
  name: string;
  summary: string;
  usage: string;
  run: (ctx: TypeCliContext) => number | void | Promise<number | void>;
}
