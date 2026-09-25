import config from "./config.ts";

export interface ChatRecord {
  timestamp: string;
  agent: string;
  model?: string;
  route?: string;
  status?: number;
  durationMs?: number;
  requestText?: string;
  // responseText belum diisi: body upstream adalah stream yang kalau
  // dibaca langsung akan menghabiskan response. Nanti pakai tee/clone
  // (upstreamResponse.clone()) saat implementasi sqlite.
  responseText?: string;
}

// Placeholder pencatatan chat, di-gate oleh `debug.is_save_chat`.
// Untuk sekarang cuma metadata + request (tanpa isi response).
// TODO: persist ke sqlite.
// async disiapkan untuk operasi sqlite nanti.
// deno-lint-ignore require-await
export async function saveChat(record: ChatRecord): Promise<void> {
  if (!config.debug.is_save_chat) return;
  // TODO: tulis record ke sqlite ganti console.debug ini.
  console.debug(JSON.stringify({ event: "save_chat", ...record }));
}
