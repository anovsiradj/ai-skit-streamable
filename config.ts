import configDefaults from "./configDefaults.ts"
import configSecrets from "./configSecrets.ts"
import { TypeConfigAgent } from "./types.ts"

function mergeAgents(
	defaults: Record<string, TypeConfigAgent> = {},
	secrets: Record<string, TypeConfigAgent> = {},
): Record<string, TypeConfigAgent> {
	const merged: Record<string, TypeConfigAgent> = {
		...defaults,
	}

	for (const [agentName, agentConfig] of Object.entries(secrets)) {
		merged[agentName] = {
			...(merged[agentName] ?? {}),
			...agentConfig,
			models: {
				...(merged[agentName]?.models ?? {}),
				...(agentConfig.models ?? {}),
			},
		}
	}

	return merged
}

const agents = mergeAgents(
	configDefaults.agents,
	configSecrets.agents,
)

export default {
	agents,
}
