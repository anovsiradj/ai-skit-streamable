import { TypeConfigAgent, TypeConfigDebug } from "./types.ts";

const agents: Record<string, TypeConfigAgent> = {
  // https://build.nvidia.com/models?filters=nimType%3Anim_type_preview
  nvidia: {
    url: "https://integrate.api.nvidia.com/v1",
    modelsConfigs: {
      "^(meta|poolside)\/": {
        temperature: 1,
        top_p: 0.95,
        max_tokens: 8192,
        stream: false,
      },
      "vision\-instruct$": {
        "frequency_penalty": 0,
        "max_tokens": 512,
        "presence_penalty": 0,
        "stream": false,
        "temperature": 1,
        "top_p": 1,
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
      "moonshotai/kimi-k3": {
        config: {
          "max_tokens": 16384,
          "seed": 0,
          "stream": false,
          "temperature": 1,
          "reasoning_effort": "max",
        },
      },
      "z-ai/glm-5.3": {},
      "z-ai/glm-5.3-flash": {},
      "meta/muse-glimmer-30b": {},
      "meta/llama-3.2-11b-vision-instruct": {},
      "meta/llama-3.2-90b-vision-instruct": {},
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
      "nvidia/nemotron-3-super-120b-a12b": {
        config: {
          temperature: 0.5,
          top_p: 1,
          max_tokens: 1024,
          stream: false,
        },
      },
      // models
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
