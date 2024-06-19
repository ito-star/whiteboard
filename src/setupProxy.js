/**
 * Create React App proxy setup
 *
 * This file exists mainly to allow the custom headers set up by firebase.json to be served by the
 * Create React App dev server.
 *
 * @see https://create-react-app.dev/docs/proxying-api-requests-in-development#configuring-the-proxy-manually
 */
const superstatic = require("superstatic");
const { createProxyMiddleware } = require("http-proxy-middleware");

superstatic.stacks.react = ["redirects", "headers"];

module.exports = function proxy(app) {
  const ss = superstatic({
    debug: true,
    stack: "react",
  });

  app.use(ss);

  app.use(
    [
      "/oidc/interaction/:uid/*",
      /\/oidc(?!\/interaction)/,
      "/api-docs",
      "/api-docs/**",
      "/api-specs/**",
    ],
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true,
      xfwd: true,
    })
  );
};
