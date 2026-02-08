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

To use your own vault instead of the demo data:

1. Copy the example config:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set `VAULT_PATH` to the absolute path of your Obsidian daily notes folder:
   ```
   VAULT_PATH=/Users/yourname/Documents/My Vault/Daily Notes
   ```

3. Restart the app (`Ctrl+C`, then `npm start`).

The app expects markdown files named `YYYY-MM-DD.md` inside that folder. Without a `.env` file, the server falls back to the bundled `mock-vault/` directory.

### Configuration Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `VAULT_PATH` | Absolute path to your Obsidian daily notes folder | `mock-vault/Daily Note` (bundled demo) |
| `API_PORT` | Port for the Express API server | `3001` |
| `PORT` | Port for the React dev server | `3000` |

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
│   ├── index.js               # React entry point
│   └── index.css              # Global styles and CSS variables
├── .env.example               # Template configuration
├── .gitignore
├── package.json
└── README.md
```

## License

MIT
