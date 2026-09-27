import { TypeConfigAgent, TypeConfigDebug } from "./types.ts";

const agents: Record<string, TypeConfigAgent> = {
  // source <https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash>
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1",
    modelsConfigs: {
      "^(meta|poolside)\/": {
        temperature: 1,
        top_p: 0.95,
        max_tokens: 8192,
        stream: false,
      },
      "^z\-ai\/": {
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
        stream: false,
      },
    },
    models: {
      "deepseek-ai/deepseek-v4.1-flash": {
        config: {
          temperature: 1,
          top_p: 0.95,
          max_tokens: 262144,
          stream: false,
        },
      },
      "z-ai/glm-5.3": {},
      "z-ai/glm-5.3-flash": {},
      "meta/muse-glimmer-30b": {},
      "poolside/laguna-xs-2.1": {},
      "openai/gpt-oss-20b": {
        config: {
          temperature: 1,
          top_p: 1,
          max_tokens: 4096,
          stream: false,
        },
      },
      "mistralai/mistral-nemotron": {
        config: {
          temperature: 0.6,
          top_p: 0.7,
          max_tokens: 4096,
          stream: false,
        },
      },
    },
  },
};

const debug: TypeConfigDebug = {
  is_save_chat: false,

  agent: "nvidia",
  model: "deepseek-ai/deepseek-v4.1-flash",
  prompt: "hello",

  host: "localhost",
  port: 8080,
};

export default {
  debug,
  agents,
};
