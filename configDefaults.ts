import { TypeConfigAgent, TypeConfigDebug } from "./types.ts"

const agents: Record<string, TypeConfigAgent> = {
	// source <https://build.nvidia.com/deepseek-ai/deepseek-v4.1-flash>
	nvidia: {
		url: "https://integrate.api.nvidia.com/v1",
		models: {
			"deepseek-ai/deepseek-v4.1-flash": {
				config: {
					temperature: 1,
					top_p: 0.95,
					max_tokens: 262144,
					stream: false,
				}
			}
		},
	}
}
const debug: TypeConfigDebug = {
	agent: 'nvidia',
	model: 'deepseek-ai/deepseek-v4.1-flash',
	prompt: 'hello',

	host: 'localhost',
	port: 8080,
}

export default {
	debug,
	agents,
}
