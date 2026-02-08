/**
 * Startup script — loads config from .env (or .env.example) and
 * launches both the API server and React dev server with the
 * correct environment variables.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Determine which env file to use
const envFile = fs.existsSync(path.join(__dirname, '.env')) ? '.env' : '.env.example';
require('dotenv').config({ path: path.join(__dirname, envFile) });

const API_PORT = process.env.API_PORT || '3001';
const CLIENT_PORT = process.env.PORT || '3000';

console.log(`\n📋 Obsidian Kanban Dashboard`);
console.log(`   Config:  ${envFile}`);
console.log(`   API:     http://localhost:${API_PORT}`);
console.log(`   Client:  http://localhost:${CLIENT_PORT}\n`);

// Pass the loaded env to both child processes
const env = { ...process.env, API_PORT, PORT: CLIENT_PORT };

const server = spawn('node', ['server/index.js'], { env, stdio: 'inherit' });
const client = spawn('npx', ['react-scripts', 'start'], { env, stdio: 'inherit' });

// If either exits, kill the other
function cleanup() {
  server.kill();
  client.kill();
  process.exit();
}

server.on('close', cleanup);
client.on('close', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
