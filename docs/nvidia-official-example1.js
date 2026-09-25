import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "deepseek-ai/deepseek-v4.1-flash",
    messages: [{
      "role": "user",
      "content": [{
        "type": "text",
        "text":
          "Describe the path in this image and the landscape around it in two sentences.",
      }, {
        "type": "image_url",
        "image_url": {
          "url": "data:image/jpeg;base64,...",
        },
      }],
    }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 262144,
    stream: false,
  });

  console.log(completion.choices[0]?.message);
}

main();
