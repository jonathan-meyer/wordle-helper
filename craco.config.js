module.exports = {
  typescript: {
    enableTypeChecking: true,
  },
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      return {
        ...webpackConfig,
        entry: {
          main: [
            env === "development" &&
              require.resolve("react-dev-utils/webpackHotDevClient"),
            paths?.appIndexJs,
          ].filter(Boolean),
          content: "./src/chromeServices/content.ts",
          service_worker: "./src/chromeServices/service_worker.ts",
        },
        output: {
          ...webpackConfig.output,
          filename: "static/js/[name].js",
        },
        optimization: {
          ...webpackConfig.optimization,
          runtimeChunk: false,
        },
        // resolve: {
        //   fallback: {
        //     url: false, // require.resolve("url/"),
        //   },
        // },
      };
    },
  },
};
