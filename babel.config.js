module.exports = api => {
  const isTest = String(api.env()) === "test";

  const plugins = [
    ["@babel/plugin-proposal-class-properties", { loose: false }]
  ];

  const presets = [
    [
      "@babel/preset-env",
      {
        debug: false,
        modules: isTest ? "commonjs" : false,
        useBuiltIns: "entry"
      }
    ]
  ];

  return {
    plugins,
    presets
  };
};
