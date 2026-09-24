## Title: Resolving Error: "This model only supports single tool-calls at once! (in tool_use:95)"

### Problem Summary
When executing workflows or agents inside OpenCode, users may encounter the following error message during the completion phase:
```text
Failed to generate completions: Failed to apply prompt template: invalid operation: This model only supports single tool-calls at once! (in tool_use:95)
```

### Root Cause
This error triggers when the OpenCode engine or orchestrating agent framework attempts to send **parallel tool calls** in a single generation step to an underlying model that does not natively support multi-tool execution. 

1. **Model Capability Mismatch:** Certain models (such as DeepSeek-V3, Gemini 1.5 Flash, or various open-source models deployed via Ollama/vLLM) lack support for parallel tool calling.
2. **OpenCode Batching Mechanism:** OpenCode's batch system inherently attempts to optimize operations by bundling multiple tasks into parallel tool payloads. When the prompt template parser (`tool_use:95`) attempts to map multiple parallel requests into a model structure configured exclusively for single tool interaction, the operation fails.

---

### Technical Constraints Reference
For context, OpenCode and its provider integrations operate under the following architectural limits:

| Limit Type | Constraint Detail |
| :--- | :--- |
| **OpenCode Batch Cap** | Maximum of **25 tool calls** per execution batch. |
| **Provider Ceilings** | Upstream API tool registration maximums (e.g., **128 tools** for OpenAI, **200 tools** for xAI). |
| **Output Token Cap** | Enforces a silent ceiling of **32,000 max output tokens** per single step. |
| **OpenCode Zen Rates** | Direct API key usage is rate-limited to **100 requests per minute** per model. |

---

### Solutions and Workarounds

#### Method 1: Disable Parallel Tool Execution in Code
Explicitly configure your model invocation client or SDK parameters to turn off parallel tool generation. 

* **Python SDK / Raw API Payload:**
  Ensure the `parallel_tool_calls` parameter is explicitly mapped to `False`.
  ```json
  {
    "model": "your-chosen-model",
    "messages": [...],
    "tools": [...],
    "parallel_tool_calls": false
  }
  ```

#### Method 2: System Prompt Enforcement
If you are using custom OpenCode workflows or Modelfiles where SDK parameter editing is restricted, inject strict boundaries into the model's system instructions:
> *"CRITICAL: You must only invoke a single tool call per response step. Do not attempt to bundle or execute multiple tools simultaneously under any circumstances."*

#### Method 3: Transition to a Parallel-Capable Model
If your agentic workflows fundamentally rely on multi-tool batch execution, switch the target runtime model inside OpenCode to an architecture designed for parallel operations:
* **Commercial:** `gpt-4o`, `claude-3-5-sonnet`
* **Open Source / High Throughput:** `groq/llama-3.1-70b`
