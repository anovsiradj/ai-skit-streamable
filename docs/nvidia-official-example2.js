import axios from "axios";

const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
const stream = false;

const headers = {
  "Authorization": "Bearer $NVIDIA_API_KEY",
  "Accept": stream ? "text/event-stream" : "application/json",
};

async function main() {
  const payload = {
    "model": "google/gemma-4-31b-it",
    "max_tokens": 1024,
    "stream": stream,
    "temperature": 0.5,
    "top_p": 1,
    "stop": null,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "seed": 0,
    "messages": [{
      "role": "system",
      "content": "You are a helpful assistant.",
    }, { "role": "user", "content": "What is 17 * 23?" }],
  };

  const response = await axios.post(invokeUrl, payload, {
    headers: headers,
    responseType: stream ? "stream" : "json",
  });

  if (stream) {
    response.data.on("data", (chunk) => {
      console.log(chunk.toString());
    });
  } else {
    console.log(JSON.stringify(response.data));
  }
}

main().catch((error) => {
  if (error.response) {
    console.error(`HTTP ${error.response.status}`);
    if (error.response.data?.on) {
      error.response.data.on(
        "data",
        (chunk) => console.error(chunk.toString()),
      );
    } else {
      console.error(error.response.data);
    }
  } else {
    console.error(error);
  }
});
