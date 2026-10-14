import config, { describeModelConfig } from "../../../config.ts";
import {
  knownModels,
  printJson,
  proxyBase,
  proxyFetch,
  resolveAgent,
  resolveModel,
} from "../core.ts";
import type { TypeCliModule } from "../types.ts";

export const modelListModule: TypeCliModule = {
  name: "model:list",
  summary: "daftar model dari upstream (GET models)",
  usage: "deno task cli model:list [--agent <nama>] [--raw]",

  async run({ args }) {
    const agent = resolveAgent(args.flags);
    const route = `${agent}/models`;

    console.log(`GET ${proxyBase()}/${route}`);

    const res = await proxyFetch(route);
    const text = await res.text();

    if (!res.ok) {
      console.error(`status=${res.status} error body: ${text}`);
      return 1;
    }

    const data = JSON.parse(text);
    if (args.flags.raw) {
      printJson(data);
      return;
    }

    const items = Array.isArray(data?.data) ? data.data : [];
    const configured = new Set(knownModels(agent));
    for (const item of items) {
      const id = item?.id;
      if (typeof id !== "string") continue;
      console.log(`${configured.has(id) ? "*" : " "} ${id}`);
    }
    console.log(
      `total=${items.length} (${configured.size} terdaftar di agents.${agent}.models)`,
    );
  },
};

export const modelInfoModule: TypeCliModule = {
  name: "model:info",
  summary: "config ter-resolve untuk satu model (lokal, tanpa network)",
  usage: "deno task cli model:info <model> [--agent <nama>]",

  run({ args }) {
    const agent = resolveAgent(args.flags);
    const model = resolveModel(args.flags, args.positionals[0]);
    const detail = describeModelConfig(agent, model);

    console.log(`agent     : ${agent}`);
    console.log(`url       : ${config.agents[agent]?.url ?? "-"}`);
    console.log(`model     : ${model}`);
    console.log(
      `regexp    : ${
        detail.patterns.length
          ? detail.patterns.join(", ")
          : "(tidak ada yang cocok)"
      }`,
    );
    console.log(`terdaftar : ${detail.listed ? "ya" : "tidak"}`);
    console.log("config    :");
    printJson(detail.config);
  },
};
