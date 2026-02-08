# Obsidian Daily Kanban

A Trello-style weekly Kanban board that connects directly to your [Obsidian](https://obsidian.md) daily notes. View, edit, and organize your tasks across a full week — with every change synced back to your vault in real time.

**Works out of the box** — the project ships with a mock vault containing a week of sample tasks, so you can clone, install, and run immediately. When you're ready, point it at your real Obsidian vault.

## Features

- **Weekly Kanban board** — Seven columns (Monday through Sunday) display your tasks at a glance, with the current day highlighted. Navigate between weeks with a single click.

- **Bidirectional sync** — Changes you make in the board write back to your `.md` files instantly. Edits made in Obsidian are picked up by the file watcher and pushed to the browser via Server-Sent Events (SSE) — no manual refresh needed.

- **Drag and drop** — Move a task from one day to another by dragging its card, or reorder tasks within a day. A drop indicator shows exactly where the task will land.

- **Inline editing** — Double-click any task to rename it in place. Press Enter to save or Escape to cancel.

- **Add and delete tasks** — Click "+ Add task" at the bottom of any column to append a new item. Hover over a card to reveal the delete button.

- **Checkbox support** — Handles both plain list items (`- task`) and Obsidian-style checkboxes (`- [ ] task` / `- [x] task`). Clicking the checkbox toggles completion and writes the updated state back to the file.

- **Progress tracking** — Each column shows a small progress bar and count (e.g. 3/6) based on completed tasks.

- **Light/dark theme** — Toggle between light and dark mode with the sun/moon button in the header. Your preference is persisted across sessions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, CSS custom properties, HTML5 Drag & Drop API |
| Backend | Node.js, Express |
| File watching | chokidar |
| Live updates | Server-Sent Events (SSE) |
| Configuration | dotenv |

No database required — your Obsidian vault **is** the data store.

## Prerequisites

- [Node.js](https://nodejs.org) 16 or later

## Quick Start

```bash
git clone https://github.com/sseaburn/Obsidian_Dashboard.git
cd Obsidian_Dashboard
npm install
npm start
```

That's it. The app launches with the bundled demo data and opens at **http://localhost:3000**. Navigate to the week of **Feb 2–8, 2026** to see the sample tasks.

## Connecting Your Obsidian Vault

To use your own vault instead of the demo data, open `.env.example` and change `VAULT_PATH` to the absolute path of your daily notes folder:

```
VAULT_PATH=/Users/yourname/Documents/My Vault/Daily Notes
```

Then restart the app (`Ctrl+C`, then `npm start`).

If you'd prefer to keep your personal config out of version control, copy the file first and edit the copy:

```bash
cp .env.example .env
```

The app reads `.env` if it exists, otherwise falls back to `.env.example`. The app expects markdown files named `YYYY-MM-DD.md` inside the configured folder.

## Configuration

All configuration lives in a single file: `.env.example` (or `.env` if you've created one). The app reads `.env` first, and falls back to `.env.example` if no `.env` exists.

### Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_PATH` | Path to your Obsidian daily notes folder (absolute or relative) | `./mock-vault/Daily Note` |
| `API_PORT` | Port for the Express API server | `3001` |
| `PORT` | Port for the React dev server | `3000` |

### Changing Ports

If you have port conflicts (common when running multiple projects), edit `API_PORT` and `PORT` in your config file:

```
API_PORT=3007
PORT=3008
```

Then restart the app. Both the backend server and the React dev proxy read from the same config file — no other files need to change.

**If you see "Something is already running on port XXXX"**, kill the process using that port first:

```bash
# Find and kill whatever is on port 3000 (or whichever port conflicts)
lsof -ti :3000 | xargs kill -9
```

### How the Architecture Works

The app runs two processes simultaneously:

1. **Express API server** (`server/index.js`) — runs on `API_PORT` (default 3001). This reads and writes your Obsidian vault files and watches for changes.

2. **React dev server** — runs on `PORT` (default 3000). This serves the frontend and proxies all `/api` requests to the Express server automatically.

The proxy is handled by `src/setupProxy.js`, which reads `API_PORT` from your config so the frontend always knows where the backend is. You never need to edit this file — just change the port in your `.env` or `.env.example` and everything stays in sync.

The startup script (`start.js`) loads your config first, then launches both processes with the correct environment variables.

### Daily Note Format

Each daily note file can contain tasks in either format:

```markdown
# 2026-02-05

- Pick up groceries
- [ ] Finish report
- [x] Send invoice
```

Both plain list items and checkbox-style items are supported.

## Usage

**Navigate weeks** — Use the `‹` and `›` arrows in the header to move between weeks, or click **Today** to jump back to the current week.

**Complete a task** — Click the circle to the left of any task to toggle it between done and not done.

**Edit a task** — Double-click the task text. An inline editor appears — press Enter to save or Escape to discard.

**Add a task** — Click **+ Add task** at the bottom of any day column and type the task description.

**Move a task** — Drag a card from one column and drop it on another day, or drag within a column to reorder. Both files are updated on drop.

**Delete a task** — Hover over a card and click the **×** button that appears on the right.

**Switch theme** — Click the sun/moon icon in the top-right corner to toggle between dark and light mode.

## Project Structure

```
Obsidian_Dashboard/
├── mock-vault/
│   └── Daily Note/            # Bundled demo data (7 days of sample tasks)
├── public/
│   └── index.html             # HTML entry point
├── server/
│   └── index.js               # Express API + file watcher
├── src/
│   ├── App.js                 # React Kanban board
│   ├── App.css                # Board and card styles
│   ├── setupProxy.js          # Dev proxy — routes /api to Express server
│   ├── index.js               # React entry point
│   └── index.css              # Global styles and CSS variables
├── start.js                   # Startup script — loads config, launches both servers
├── .env.example               # Default configuration (works out of the box)
├── .gitignore
├── package.json
└── README.md
```

## License

MIT
