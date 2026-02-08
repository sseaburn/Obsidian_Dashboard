const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..');

// Load .env if it exists, otherwise fall back to .env.example
const envFile = fs.existsSync(path.join(ROOT, '.env')) ? '.env' : '.env.example';
require('dotenv').config({ path: path.join(ROOT, envFile) });

const express = require('express');
const cors = require('cors');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Resolve vault path (supports both relative and absolute paths)
const rawVaultPath = process.env.VAULT_PATH || './mock-vault/Daily Note';
const VAULT_PATH = path.isAbsolute(rawVaultPath)
  ? rawVaultPath
  : path.resolve(ROOT, rawVaultPath);

app.use(cors());
app.use(express.json());

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekDates(referenceDate) {
  const ref = new Date(referenceDate);
  const day = ref.getDay(); // 0=Sun
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((day + 6) % 7)); // go back to Monday

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function parseNote(content) {
  const lines = content.split('\n');
  const tasks = [];
  let headerSkipped = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip the heading line (e.g., # 2026-02-05)
    if (trimmed.startsWith('#')) {
      headerSkipped = true;
      continue;
    }

    // Skip empty lines
    if (!trimmed) continue;

    // Match checkbox tasks: - [ ] or - [x]
    const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)/);
    if (checkboxMatch) {
      tasks.push({
        text: checkboxMatch[2].trim(),
        completed: checkboxMatch[1].toLowerCase() === 'x',
        format: 'checkbox',
      });
      continue;
    }

    // Match plain list items: - item
    const listMatch = trimmed.match(/^-\s+(.+)/);
    if (listMatch) {
      tasks.push({
        text: listMatch[1].trim(),
        completed: false,
        format: 'plain',
      });
      continue;
    }
  }

  return tasks;
}

function serializeNote(dateStr, tasks) {
  let content = `# ${dateStr}\n\n`;
  for (const task of tasks) {
    if (task.format === 'checkbox') {
      content += `- [${task.completed ? 'x' : ' '}] ${task.text}\n`;
    } else {
      // Keep plain format as plain list items
      content += `- ${task.text}\n`;
    }
  }
  return content;
}

function readNoteForDate(dateStr) {
  const filePath = path.join(VAULT_PATH, `${dateStr}.md`);
  if (!fs.existsSync(filePath)) {
    return { date: dateStr, tasks: [], exists: false };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const tasks = parseNote(content);
  return { date: dateStr, tasks, exists: true };
}

// ── API Routes ───────────────────────────────────────────────────────────────

// GET /api/week?date=2026-02-05  → returns tasks for the week containing that date
app.get('/api/week', (req, res) => {
  const refDate = req.query.date || formatDate(new Date());
  const dates = getWeekDates(refDate);

  const week = dates.map((dateStr) => readNoteForDate(dateStr));
  res.json({ dates, days: week });
});

// GET /api/day/:date  → returns tasks for a single day
app.get('/api/day/:date', (req, res) => {
  const note = readNoteForDate(req.params.date);
  res.json(note);
});

// PUT /api/day/:date  → update tasks for a single day (full replace)
app.put('/api/day/:date', (req, res) => {
  const dateStr = req.params.date;
  const { tasks } = req.body;

  const filePath = path.join(VAULT_PATH, `${dateStr}.md`);
  const content = serializeNote(dateStr, tasks);

  // Ensure directory exists
  if (!fs.existsSync(VAULT_PATH)) {
    fs.mkdirSync(VAULT_PATH, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  res.json({ success: true, date: dateStr, tasks });
});

// POST /api/day/:date/task  → add a task to a day
app.post('/api/day/:date/task', (req, res) => {
  const dateStr = req.params.date;
  const { text, format = 'plain' } = req.body;

  const note = readNoteForDate(dateStr);
  note.tasks.push({ text, completed: false, format });

  const filePath = path.join(VAULT_PATH, `${dateStr}.md`);
  const content = serializeNote(dateStr, note.tasks);

  if (!fs.existsSync(VAULT_PATH)) {
    fs.mkdirSync(VAULT_PATH, { recursive: true });
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  res.json({ success: true, date: dateStr, tasks: note.tasks });
});

// DELETE /api/day/:date/task/:index  → remove a task
app.delete('/api/day/:date/task/:index', (req, res) => {
  const dateStr = req.params.date;
  const index = parseInt(req.params.index, 10);

  const note = readNoteForDate(dateStr);
  if (index < 0 || index >= note.tasks.length) {
    return res.status(400).json({ error: 'Invalid task index' });
  }

  note.tasks.splice(index, 1);

  const filePath = path.join(VAULT_PATH, `${dateStr}.md`);
  const content = serializeNote(dateStr, note.tasks);
  fs.writeFileSync(filePath, content, 'utf-8');

  res.json({ success: true, date: dateStr, tasks: note.tasks });
});

// ── SSE for file-watching (live sync from Obsidian → browser) ────────────────

const clients = new Set();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.add(res);
  req.on('close', () => clients.delete(res));
});

function broadcast(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.write(msg);
  }
}

// Watch the Daily Note folder for changes
if (fs.existsSync(VAULT_PATH)) {
  const watcher = chokidar.watch(VAULT_PATH, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
  });

  watcher.on('change', (filePath) => {
    const basename = path.basename(filePath, '.md');
    // Only broadcast if it looks like a date file
    if (/^\d{4}-\d{2}-\d{2}$/.test(basename)) {
      const note = readNoteForDate(basename);
      broadcast({ type: 'update', ...note });
      console.log(`📝 File changed: ${basename}.md`);
    }
  });

  watcher.on('add', (filePath) => {
    const basename = path.basename(filePath, '.md');
    if (/^\d{4}-\d{2}-\d{2}$/.test(basename)) {
      const note = readNoteForDate(basename);
      broadcast({ type: 'add', ...note });
      console.log(`📄 New file: ${basename}.md`);
    }
  });

  console.log(`👁  Watching: ${VAULT_PATH}`);
} else {
  console.warn(`⚠️  Vault path not found: ${VAULT_PATH}`);
  console.warn(`   Create it or update VAULT_PATH in server/index.js`);
}

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Obsidian Kanban API running on http://localhost:${PORT}`);
  console.log(`📂 Reading notes from: ${VAULT_PATH}\n`);
});
