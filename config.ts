import configDefaults from "./configDefaults.ts";
import configSecrets from "./configSecrets.ts";
import { TypeConfigAgent, TypeConfigDebug } from "./types.ts";

function mergeAgents(
  defaults: Record<string, TypeConfigAgent> = {},
  secrets: Record<string, TypeConfigAgent> = {},
): Record<string, TypeConfigAgent> {
  const merged: Record<string, TypeConfigAgent> = {
    ...defaults,
  };

  for (const [agentName, agentConfig] of Object.entries(secrets)) {
    merged[agentName] = {
      ...(merged[agentName] ?? {}),
      ...agentConfig,
      models: {
        ...(merged[agentName]?.models ?? {}),
        ...(agentConfig.models ?? {}),
      },
      modelsConfigs: {
        ...(merged[agentName]?.modelsConfigs ?? {}),
        ...(agentConfig.modelsConfigs ?? {}),
      },
    };
  }

  return merged;
}

function mergeDebug(
  defaults: TypeConfigDebug = {},
  secrets: TypeConfigDebug = {},
): TypeConfigDebug {
  return {
    ...defaults,
    ...secrets,
  };
}

const agents = mergeAgents(
  configDefaults.agents,
  configSecrets.agents,
);

const debug = mergeDebug(
  configDefaults.debug,
  configSecrets.debug,
);

// Shared config per keluarga model. Key di `modelsConfigs` adalah string
// regexp yang dicocokkan terhadap nama model (urutan insert = prioritas,
// yang cocok belakangan menimpa yang cocok duluan). Config exact di
// `models[nama].config` selalu menang per-key di atas hasil regexp.
//
// Ini adalah SSoT untuk logika match regexp + merge; `resolveModelConfig()`
// hanya menampilkannya sebagai Record (untuk payload proxy).

export interface ModelConfigDetail {
  // model terdaftar di `agents[<agent>].models`?
  listed: boolean;
  // regexp modelsConfigs yang cocok, berurutan
  patterns: string[];
  // hasil merge (regexp base -> exact override)
  config: Record<string, unknown>;
}

export function describeModelConfig(
  agentName: string,
  modelName: string,
): ModelConfigDetail {
  const agentConfig = agents[agentName];
  if (!agentConfig) {
    return { listed: false, patterns: [], config: {} };
  }

  const patterns: string[] = [];
  let base: Record<string, unknown> = {};
  for (
    const [pattern, cfg] of Object.entries(agentConfig.modelsConfigs ?? {})
  ) {
    let re: RegExp;
    try {
      re = new RegExp(pattern);
    } catch {
      continue; // pattern invalid -> skip, jangan crash proxy
    }
    if (re.test(modelName)) {
      patterns.push(pattern);
      base = { ...base, ...(cfg ?? {}) };
    }
  }

  const exact = agentConfig.models?.[modelName]?.config ?? {};
  return {
    listed: agentConfig.models?.[modelName] !== undefined,
    patterns,
    config: { ...base, ...exact },
  };
}

export function resolveModelConfig(
  agentName: string,
  modelName: string,
): Record<string, unknown> {
  return describeModelConfig(agentName, modelName).config;
}

export default {
  debug,
  agents,
};
