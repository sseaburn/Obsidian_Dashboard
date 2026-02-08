import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

const API = '/api';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isToday(dateStr) {
  return dateStr === formatDate(new Date());
}

function friendlyDate(dateStr) {
  const d = parseDate(dateStr);
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function fullDayName(dateStr) {
  const d = parseDate(dateStr);
  return DAY_NAMES[d.getDay()];
}

// ── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [weekData, setWeekData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refDate, setRefDate] = useState(formatDate(new Date()));
  const [dragState, setDragState] = useState(null);
  const suppressRef = useRef(new Set());
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Fetch week data
  const fetchWeek = useCallback(async (date) => {
    try {
      const res = await fetch(`${API}/week?date=${date}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setWeekData(data);
      setError(null);
    } catch (e) {
      setError(`Cannot connect to server. Make sure it's running on port 3001.\n${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeek(refDate);
  }, [refDate, fetchWeek]);

  // SSE – live sync from Obsidian file changes
  useEffect(() => {
    const es = new EventSource(`${API}/events`);

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (suppressRef.current.has(data.date)) return;

      setWeekData((prev) => {
        if (!prev) return prev;
        const idx = prev.days.findIndex((d) => d.date === data.date);
        if (idx === -1) return prev;
        const updated = { ...prev, days: [...prev.days] };
        updated.days[idx] = { date: data.date, tasks: data.tasks, exists: true };
        return updated;
      });
    };

    es.onerror = () => {
      // Silently reconnect
    };

    return () => es.close();
  }, []);

  // Navigate weeks
  const goWeek = (offset) => {
    const d = parseDate(refDate);
    d.setDate(d.getDate() + offset * 7);
    setRefDate(formatDate(d));
    setLoading(true);
  };

  const goToday = () => {
    setRefDate(formatDate(new Date()));
    setLoading(true);
  };

  // ── Task operations (write back to Obsidian) ──────────────────────────────

  const updateDay = async (dateStr, tasks) => {
    // Optimistic update
    setWeekData((prev) => {
      if (!prev) return prev;
      const idx = prev.days.findIndex((d) => d.date === dateStr);
      if (idx === -1) return prev;
      const updated = { ...prev, days: [...prev.days] };
      updated.days[idx] = { ...updated.days[idx], tasks: [...tasks] };
      return updated;
    });

    // Suppress SSE for this date briefly to avoid echo
    suppressRef.current.add(dateStr);
    setTimeout(() => suppressRef.current.delete(dateStr), 1000);

    await fetch(`${API}/day/${dateStr}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
  };

  const toggleTask = (dateStr, taskIndex) => {
    const day = weekData.days.find((d) => d.date === dateStr);
    if (!day) return;
    const tasks = day.tasks.map((t, i) =>
      i === taskIndex ? { ...t, completed: !t.completed, format: 'checkbox' } : t
    );
    updateDay(dateStr, tasks);
  };

  const addTask = async (dateStr, text) => {
    const day = weekData.days.find((d) => d.date === dateStr);
    const tasks = [...(day?.tasks || []), { text, completed: false, format: 'plain' }];
    updateDay(dateStr, tasks);
  };

  const deleteTask = (dateStr, taskIndex) => {
    const day = weekData.days.find((d) => d.date === dateStr);
    if (!day) return;
    const tasks = day.tasks.filter((_, i) => i !== taskIndex);
    updateDay(dateStr, tasks);
  };

  const editTask = (dateStr, taskIndex, newText) => {
    const day = weekData.days.find((d) => d.date === dateStr);
    if (!day) return;
    const tasks = day.tasks.map((t, i) =>
      i === taskIndex ? { ...t, text: newText } : t
    );
    updateDay(dateStr, tasks);
  };

  // ── Drag and drop (between days + reorder within a day) ─────────────────

  const handleDragStart = (dateStr, taskIndex) => {
    setDragState({ fromDate: dateStr, taskIndex });
  };

  const handleDrop = (toDate, toIndex) => {
    if (!dragState) return;
    const { fromDate, taskIndex } = dragState;

    // Reorder within the same day
    if (fromDate === toDate) {
      if (toIndex === undefined || toIndex === taskIndex) {
        setDragState(null);
        return;
      }
      const day = weekData.days.find((d) => d.date === fromDate);
      if (!day) return;
      const tasks = [...day.tasks];
      const [moved] = tasks.splice(taskIndex, 1);
      const insertAt = toIndex > taskIndex ? toIndex - 1 : toIndex;
      tasks.splice(insertAt, 0, moved);
      updateDay(fromDate, tasks);
      setDragState(null);
      return;
    }

    // Move between days
    const fromDay = weekData.days.find((d) => d.date === fromDate);
    const toDay = weekData.days.find((d) => d.date === toDate);
    if (!fromDay) return;

    const task = fromDay.tasks[taskIndex];
    const fromTasks = fromDay.tasks.filter((_, i) => i !== taskIndex);
    const toTasks = [...(toDay?.tasks || [])];
    const insertAt = toIndex !== undefined ? toIndex : toTasks.length;
    toTasks.splice(insertAt, 0, task);

    updateDay(fromDate, fromTasks);
    updateDay(toDate, toTasks);
    setDragState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading && !weekData) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading daily notes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠️</div>
        <h2>Connection Error</h2>
        <pre>{error}</pre>
        <button onClick={() => { setError(null); setLoading(true); fetchWeek(refDate); }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-icon">◆</span>
            Obsidian Kanban
          </h1>
        </div>
        <div className="header-center">
          <button className="nav-btn" onClick={() => goWeek(-1)}>‹</button>
          <button className="today-btn" onClick={goToday}>Today</button>
          <button className="nav-btn" onClick={() => goWeek(1)}>›</button>
        </div>
        <div className="header-right">
          <span className="status-dot" />
          <span className="status-text">Live Sync</span>
          <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? (
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="board">
        {weekData?.days.map((day) => (
          <DayColumn
            key={day.date}
            day={day}
            isToday={isToday(day.date)}
            onToggle={(i) => toggleTask(day.date, i)}
            onAdd={(text) => addTask(day.date, text)}
            onDelete={(i) => deleteTask(day.date, i)}
            onEdit={(i, text) => editTask(day.date, i, text)}
            onDragStart={(i) => handleDragStart(day.date, i)}
            onDrop={(toIndex) => handleDrop(day.date, toIndex)}
            onDragEnd={handleDragEnd}
            dragState={dragState}
          />
        ))}
      </div>
    </div>
  );
}

// ── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({ day, isToday: today, onToggle, onAdd, onDelete, onEdit, onDragStart, onDrop, onDragEnd, dragState }) {
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);
  const [dropIndex, setDropIndex] = useState(null);
  const inputRef = useRef(null);

  const isDragging = dragState !== null;
  const isDragFromThis = dragState && dragState.fromDate === day.date;

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAdd(newTask.trim());
      setNewTask('');
    }
    setAdding(false);
  };

  const getDropIndex = (e, cardIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    return e.clientY < midY ? cardIndex : cardIndex + 1;
  };

  const completedCount = day.tasks.filter((t) => t.completed).length;
  const totalCount = day.tasks.length;

  return (
    <div
      className={`column ${today ? 'column-today' : ''} ${isDragging && dropIndex !== null ? 'column-dragover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        // If dragging over the empty area below cards, set drop index to end
        if (isDragging && e.target.closest('.column-body') && !e.target.closest('.task-card')) {
          setDropIndex(day.tasks.length);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setDropIndex(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(dropIndex !== null ? dropIndex : day.tasks.length);
        setDropIndex(null);
      }}
      onDragEnd={() => {
        setDropIndex(null);
        onDragEnd();
      }}
    >
      <div className="column-header">
        <div className="column-date-row">
          <span className={`column-day ${today ? 'column-day-today' : ''}`}>
            {fullDayName(day.date)}
          </span>
          {today && <span className="today-badge">TODAY</span>}
        </div>
        <span className="column-date">{friendlyDate(day.date)}</span>
        {totalCount > 0 && (
          <div className="column-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
            <span className="progress-text">{completedCount}/{totalCount}</span>
          </div>
        )}
      </div>

      <div className="column-body">
        {day.tasks.map((task, i) => (
          <React.Fragment key={`${day.date}-${i}-${task.text}`}>
            {dropIndex === i && (
              <div className="drop-indicator" />
            )}
            <TaskCard
              task={task}
              index={i}
              onToggle={() => onToggle(i)}
              onDelete={() => onDelete(i)}
              onEdit={(text) => onEdit(i, text)}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isDragging) {
                  setDropIndex(getDropIndex(e, i));
                }
              }}
              isDragSource={isDragFromThis && dragState.taskIndex === i}
            />
          </React.Fragment>
        ))}
        {dropIndex === day.tasks.length && (
          <div className="drop-indicator" />
        )}

        {day.tasks.length === 0 && !adding && dropIndex === null && (
          <div className="empty-state">
            <span className="empty-icon">○</span>
            <span>No tasks</span>
          </div>
        )}

        {adding ? (
          <form className="add-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="add-input"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onBlur={handleSubmit}
              placeholder="Task description…"
            />
          </form>
        ) : (
          <button className="add-btn" onClick={() => setAdding(true)}>
            + Add task
          </button>
        )}
      </div>
    </div>
  );
}

// ── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, index, onToggle, onDelete, onEdit, onDragStart, onDragOver, isDragSource }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleEditSubmit = () => {
    if (editText.trim() && editText.trim() !== task.text) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  return (
    <div
      className={`task-card ${task.completed ? 'task-completed' : ''} ${isDragSource ? 'task-dragging' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragOver={onDragOver}
    >
      <button
        className={`checkbox ${task.completed ? 'checkbox-checked' : ''}`}
        onClick={onToggle}
        title={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && (
          <svg viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="task-edit-input"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleEditSubmit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : (
        <span
          className="task-text"
          onDoubleClick={() => {
            setEditText(task.text);
            setEditing(true);
          }}
          title="Double-click to edit"
        >
          {task.text}
        </span>
      )}

      <div className="task-actions">
        <button className="task-action-btn drag-handle" title="Drag to move">
          ⠿
        </button>
        <button className="task-action-btn delete-btn" onClick={onDelete} title="Delete task">
          ×
        </button>
      </div>
    </div>
  );
}

export default App;
