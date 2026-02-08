const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

// Load .env so the proxy picks up API_PORT
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

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
