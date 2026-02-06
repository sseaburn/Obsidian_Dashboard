# Obsidian Daily Kanban

A Trello-style weekly Kanban board that connects directly to your [Obsidian](https://obsidian.md) daily notes. View, edit, and organize your tasks across a full week — with every change synced back to your vault in real time.

## Features

- **Weekly Kanban board** — Seven columns (Monday through Sunday) display your tasks at a glance, with the current day highlighted. Navigate between weeks with a single click.

- **Bidirectional sync** — Changes you make in the board write back to your `.md` files instantly. Edits made in Obsidian are picked up by the file watcher and pushed to the browser via Server-Sent Events (SSE) — no manual refresh needed.

- **Drag and drop** — Move a task from one day to another by dragging its card. The source and destination files are both updated automatically.

- **Inline editing** — Double-click any task to rename it in place. Press Enter to save or Escape to cancel.

- **Add and delete tasks** — Click "+ Add task" at the bottom of any column to append a new item. Hover over a card to reveal the delete button.

- **Checkbox support** — Handles both plain list items (`- task`) and Obsidian-style checkboxes (`- [ ] task` / `- [x] task`). Clicking the checkbox toggles completion and writes the updated state back to the file.

- **Progress tracking** — Each column shows a small progress bar and count (e.g. 3/6) based on completed tasks.

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
- An [Obsidian](https://obsidian.md) vault with a daily notes folder containing files named `YYYY-MM-DD.md`

## Quick Start

```bash
git clone https://github.com/sseaburn/Obsidian_Dashboard.git
cd Obsidian_Dashboard
cp .env.example .env        # then edit .env with your vault path
npm install
npm start
```

This launches both the API server (default port 3001) and the React dev server (default port 3000). Your browser should open automatically to **http://localhost:3000**.

## Configuration

All settings live in a single `.env` file (git-ignored so your paths stay private).

```bash
cp .env.example .env
```

Then open `.env` and set the variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_PATH` | Absolute path to your Obsidian daily notes folder | `~/Documents/Obsidian Vault/Daily Notes` |
| `API_PORT` | Port for the Express API server | `3001` |
| `PORT` | Port for the React dev server | `3000` |

### Daily Note Format

The app expects markdown files named `YYYY-MM-DD.md` (e.g. `2026-02-05.md`) inside the folder specified by `VAULT_PATH`. Each file can contain tasks in either format:

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

**Move a task** — Drag a card from one column and drop it on another day. Both files are updated on drop.

**Delete a task** — Hover over a card and click the **×** button that appears on the right.

## Project Structure

```
Obsidian_Dashboard/
├── public/
│   └── index.html          # HTML entry point
├── server/
│   └── index.js            # Express API + file watcher
├── src/
│   ├── App.js              # React Kanban board
│   ├── App.css             # Board and card styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles and CSS variables
├── .env.example            # Template configuration
├── .gitignore
├── package.json
└── README.md
```

## License

MIT
