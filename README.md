# Obsidian Daily Kanban

A Trello-like board that reads and syncs with your Obsidian Daily Notes.

## Quick Start

```bash
cd /Users/sseab/ai2026/Obsidian_Dashboard
npm install
npm start
```

This starts both the API server (port 3001) and the React app (port 3000).
Open **http://localhost:3000** in your browser.

## Features

- **Week view** – 7 columns (Mon–Sun) showing tasks from each daily note
- **Bidirectional sync** – edits in the app write back to `.md` files instantly;
  edits in Obsidian appear in the browser via live file-watching (SSE)
- **Drag & drop** – move tasks between days
- **Inline editing** – double-click a task to rename it
- **Add / delete tasks** – changes are written back to the vault immediately

## Vault Configuration

The server reads from:
```
~/Documents/Scott Vault/Daily Note/
```

To change this, edit `VAULT_PATH` in `server/index.js`.
