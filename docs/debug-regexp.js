const samples = [
  {
    regexp1: /^(meta|poolside)\//,
    regexp2: new RegExp("^(meta|poolside)\/"),
    models: [
      "meta/muse-glimmer-30b",
      "poolside/laguna-xs-2.1",
    ],
  },
  {
    regexp1: /^z-ai\//,
    regexp2: new RegExp("^z-ai\/"),
    models: [
      "z-ai/glm-5.3",
      "z-ai/glm-5.3-flash",
    ],
  },
];

samples.forEach((sample) => {
  sample.models.forEach((model) => {
    console.debug(
      model,
      sample.regexp1.test(model),
      sample.regexp2.test(model),
    );
  });
});
