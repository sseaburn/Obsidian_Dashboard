const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');

// Load .env if it exists, otherwise fall back to .env.example
const ROOT = path.join(__dirname, '..');
const envFile = fs.existsSync(path.join(ROOT, '.env')) ? '.env' : '.env.example';
require('dotenv').config({ path: path.join(ROOT, envFile) });

const API_PORT = process.env.API_PORT || 3001;

module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://localhost:${API_PORT}`,
      changeOrigin: true,
    })
  );
};
