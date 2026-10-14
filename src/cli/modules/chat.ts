import { resolveModelConfig } from "../../../config.ts";
import {
  promptFrom,
  proxyBase,
  proxyFetch,
  proxyPost,
  resolveAgent,
  resolveModel,
} from "../core.ts";
import type { TypeCliModule } from "../types.ts";

export const chatModule: TypeCliModule = {
  name: "chat",
  summary: "debug chat lewat proxy (POST chat/completions)",
  usage: "deno task cli chat [--agent <nama>] [--model <nama>] [pesan...]",

  async run({ args }) {
    const agent = resolveAgent(args.flags);
    const model = resolveModel(args.flags);
    const prompt = promptFrom(args.positionals);

    const route = `${agent}/chat/completions`;
    const payload = {
      model,
      messages: [{ role: "user", content: prompt }],
      ...resolveModelConfig(agent, model),
    };

    console.log(`POST ${proxyBase()}/${route}`);
    console.log(`agent=${agent} model=${model}`);
    console.log(`prompt=${JSON.stringify(prompt)}`);

    const res = await proxyFetch(route, proxyPost(payload));
    const text = await res.text();

    console.log(`status=${res.status}`);

    if (!res.ok) {
      console.error(`error body: ${text}`);
      return 1;
    }

    try {
      const data = JSON.parse(text);
      const content = data.choices?.[0]?.message?.content ??
        data.choices?.[0]?.delta?.content ??
        JSON.stringify(data, null, 2);
      console.log("--- reply ---");
      console.log(
        typeof content === "string"
          ? content
          : JSON.stringify(content, null, 2),
      );
    } catch {
      console.log(text);
    }
  },
};
