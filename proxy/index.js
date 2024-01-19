/* Simple CORS proxy - see https://dev.to/decker67/write-your-own-cors-proxy-with-nodejs-in-no-time-30f9  */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { createProxyMiddleware } = require("http-proxy-middleware");

const configFilePath = path.join(__dirname, "config.json");
let config = {};

const app = express();
app.use(cors());

// load configuration
try {
  const configFile = fs.readFileSync(configFilePath, "utf8");
  config = JSON.parse(configFile);
} catch (err) {
  console.error("Error while reading the config file:", err);
}

// path for DeepL
app.use(
  createProxyMiddleware("/deepl/v2/translate", {
    target: "https://api.deepl.com",
    pathRewrite: {
      "^/deepl": "", // removing first part "/deepl" of the request path
    },
    onProxyReq: (proxyReq, req, res) => {
      // additional headers
      const authHeader = "DeepL-Auth-Key " + config.deepl_api_key;
      proxyReq.setHeader("Authorization", authHeader);
    },
    changeOrigin: true,
    logger: console,
  })
);

// path for ModernMT
app.use(
  createProxyMiddleware("/modernmt", {
    target: "https://api.modernmt.com",
    pathRewrite: {
      "^/modernmt": "", // removing first part "/modernmt" of the request path
    },
    onProxyReq: (proxyReq, req, res) => {
      // additional headers
      proxyReq.setHeader("MMT-ApiKey", config.modernmt_api_key);
    },
    changeOrigin: true,
    logger: console,
  })
);

// start proxy server
app.listen(config.port, () => {
  console.info("proxy server is running on port " + config.port);
});
