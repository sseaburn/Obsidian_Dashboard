# Obsidian Daily Kanban

A Trello-like board that reads and syncs with your Obsidian Daily Notes.

## Quick Start

```bash
git clone https://github.com/sseaburn/Obsidian_Dashboard.git
cd Obsidian_Dashboard
cp .env.example .env        # then edit .env with your vault path
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

## Configuration

Copy `.env.example` to `.env` and set your vault path:

```bash
cp .env.example .env
```

Then edit `.env` to point `VAULT_PATH` at your Obsidian daily notes folder.
