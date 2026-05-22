# Design Document — To-Do List Life Dashboard

## Overview

A single-page personal life dashboard built with vanilla HTML, CSS, and JavaScript. No build tools, no frameworks, no backend. All state lives in `localStorage`. The app is structured as three files:

```
index.html          ← markup and widget skeletons
css/style.css       ← all styles, CSS custom properties for theming
js/app.js           ← all logic, organized into widget modules
```

The default theme is **dark mode**. The app initializes synchronously so the correct theme is applied before the first paint, preventing any flash.

---

## Architecture

### File Structure

```
d:\CodingCamp-18May26-Michelle\
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

### Module Organization (inside `app.js`)

`app.js` is organized into self-contained sections, each responsible for one widget. A single `init()` function at the bottom bootstraps everything.

```
app.js
├── Storage helpers       (get/set wrappers around localStorage)
├── Theme module          (load, toggle, persist)
├── Greeting module       (clock, date, greeting text, name editing)
├── Timer module          (countdown, start/stop/reset, alert, duration editing)
├── Todo module           (add, edit, toggle, delete, render, persist)
├── Links module          (add, remove, render, persist)
└── init()                (wires all modules together on DOMContentLoaded)
```

---

## Data Models

All data is stored in `localStorage` as JSON strings under these keys:

| Key | Type | Description |
|---|---|---|
| `dashboard_theme` | `"dark"` \| `"light"` | Active theme |
| `dashboard_username` | `string` | User's display name |
| `dashboard_timer_duration` | `number` | Timer duration in minutes |
| `dashboard_todos` | `Task[]` | Array of task objects |
| `dashboard_links` | `Link[]` | Array of quick link objects |

### Task Object

```js
{
  id: string,       // crypto.randomUUID() or Date.now().toString()
  text: string,     // task description
  done: boolean     // completion state
}
```

### Link Object

```js
{
  id: string,       // unique identifier
  label: string,    // display label for the button
  url: string       // full URL (e.g. "https://github.com")
}
```

---

## Component Design

### Storage Helpers

```js
function storageGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
```

---

### Theme Module

Applied **before** `DOMContentLoaded` fires (inline `<script>` in `<head>`) to prevent flash:

```js
// In <head> — runs synchronously before render
(function() {
  const theme = localStorage.getItem('dashboard_theme');
  document.documentElement.setAttribute(
    'data-theme',
    theme ? JSON.parse(theme) : 'dark'
  );
})();
```

CSS uses `[data-theme="dark"]` and `[data-theme="light"]` selectors on `:root` to swap CSS custom properties.

**Toggle logic:**

```js
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('dashboard_theme', next);
}
```

---

### Greeting Module

**Pure helper functions:**

```js
// Returns greeting prefix for a given hour (0-23)
function getGreetingPrefix(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  return 'Good evening';
}

// Builds full greeting string
function buildGreeting(hour, name) {
  const prefix = getGreetingPrefix(hour);
  return name && name.trim() ? `${prefix}, ${name.trim()}!` : prefix;
}

// Formats a Date into "Monday, 26 May 2025"
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// Formats a Date into HH:MM:SS
function formatTime(date) {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}
```

**Clock tick (called every second via `setInterval`):**

```js
function tickClock() {
  const now = new Date();
  clockEl.textContent = formatTime(now);
  dateEl.textContent = formatDate(now);
  greetingEl.textContent = buildGreeting(now.getHours(), storageGet('dashboard_username', ''));
}
```

**Name editing:** An inline `<input>` or `<span>` with a pencil icon. On confirm (Enter or blur), the new name is saved and the greeting re-renders.

---

### Timer Module

**State:**

```js
let timerInterval = null;   // setInterval handle
let remainingSeconds = 0;   // current countdown value
```

**Pure helper:**

```js
// Converts total seconds to "MM:SS" string
function formatCountdown(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
```

**Controls:**

```js
function startTimer() {
  if (timerInterval) return; // already running
  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      triggerTimerAlert();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  stopTimer();
  remainingSeconds = storageGet('dashboard_timer_duration', 25) * 60;
  renderTimer();
}
```

**Alert:** Uses the Web Audio API to generate a short beep tone, plus a CSS class `timer--done` applied to the timer widget for a visual highlight.

```js
function triggerTimerAlert() {
  // Visual
  timerEl.classList.add('timer--done');
  // Audible — Web Audio API beep
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 1);
}
```

---

### To-Do List Module

**Pure helpers:**

```js
function createTask(text) {
  return { id: Date.now().toString(), text: text.trim(), done: false };
}

function addTask(tasks, text) {
  if (!text || !text.trim()) return tasks; // reject empty/whitespace
  return [...tasks, createTask(text)];
}

function toggleTask(tasks, id) {
  return tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
}

function editTask(tasks, id, newText) {
  if (!newText || !newText.trim()) return tasks;
  return tasks.map(t => t.id === id ? { ...t, text: newText.trim() } : t);
}

function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}
```

**State and render:**

```js
let todos = storageGet('dashboard_todos', []);

function saveTodos() {
  storageSet('dashboard_todos', todos);
}

function renderTodos() {
  todoListEl.innerHTML = '';
  todos.forEach(task => {
    const li = buildTaskElement(task);
    todoListEl.appendChild(li);
  });
}
```

Each task renders as:

```html
<li class="task [task--done]" data-id="...">
  <button class="task__toggle" aria-label="Toggle complete">✓</button>
  <span class="task__text">...</span>
  <button class="task__edit" aria-label="Edit task">✎</button>
  <button class="task__delete" aria-label="Delete task">✕</button>
</li>
```

---

### Quick Links Module

**Pure helpers:**

```js
function createLink(label, url) {
  return { id: Date.now().toString(), label: label.trim(), url: url.trim() };
}

function addLink(links, label, url) {
  if (!label || !label.trim() || !url || !url.trim()) return links;
  return [...links, createLink(label, url)];
}

function removeLink(links, id) {
  return links.filter(l => l.id !== id);
}
```

Each link renders as:

```html
<div class="link-item">
  <a class="link-item__btn" href="..." target="_blank" rel="noopener noreferrer">Label</a>
  <button class="link-item__remove" aria-label="Remove link">✕</button>
</div>
```

---

### CSS Theming

All colors are CSS custom properties on `:root`. Theme switching is done by changing `data-theme` on `<html>`.

```css
:root[data-theme="dark"] {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-widget: #0f3460;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --accent: #e94560;
  --border: #2a2a4a;
}

:root[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-widget: #ffffff;
  --text-primary: #1a1a2e;
  --text-secondary: #555577;
  --accent: #e94560;
  --border: #dde1e7;
}
```

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Dashboard</title>
  <script>/* inline theme init */</script>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <header class="header">
    <div id="greeting-widget">...</div>
    <button id="theme-toggle" aria-label="Toggle theme">...</button>
  </header>

  <main class="dashboard-grid">
    <section id="timer-widget" class="widget">...</section>
    <section id="todo-widget" class="widget">...</section>
    <section id="links-widget" class="widget">...</section>
  </main>

  <script src="js/app.js"></script>
</body>
</html>
```

The dashboard uses CSS Grid for layout — a two-column grid on wider screens, single column on mobile.

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private browsing) | `storageGet` returns fallback; `storageSet` silently fails |
| Malformed JSON in `localStorage` | `try/catch` in `storageGet` returns fallback |
| Empty task/link submission | Rejected client-side; no state change |
| Timer already running on Start click | Guard clause prevents double-interval |
| Web Audio API unavailable | `try/catch` around `AudioContext`; visual alert still fires |

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting prefix covers all hours

For any integer hour in the range [0, 23], `getGreetingPrefix(hour)` SHALL return exactly one of "Good morning", "Good afternoon", or "Good evening", and the three ranges [5–11], [12–17], [18–23, 0–4] are exhaustive and mutually exclusive.

**Validates: Requirements 2.3, 2.4, 2.5**

---

### Property 2: Greeting includes name when name is non-empty

For any hour in [0, 23] and any non-empty, non-whitespace string `name`, `buildGreeting(hour, name)` SHALL contain `name.trim()` in its output.

**Validates: Requirements 2.6, 2.8**

---

### Property 3: Date format contains required components

For any valid `Date` object, `formatDate(date)` SHALL return a string that contains the full weekday name, the numeric day, the full month name, and the four-digit year.

**Validates: Requirements 2.2**

---

### Property 4: Timer countdown format is always MM:SS

For any non-negative integer `totalSeconds`, `formatCountdown(totalSeconds)` SHALL return a string matching the pattern `^\d{2}:\d{2}$` where the minutes and seconds values correctly represent `totalSeconds`.

**Validates: Requirements 3.7**

---

### Property 5: Adding a valid task grows the list by exactly one

For any task list and any non-empty, non-whitespace string `text`, `addTask(tasks, text)` SHALL return a list whose length is exactly `tasks.length + 1`, and the new list SHALL contain a task whose `text` property equals `text.trim()`.

**Validates: Requirements 4.1**

---

### Property 6: Whitespace-only task submission is rejected

For any task list and any string `text` composed entirely of whitespace characters (including the empty string), `addTask(tasks, text)` SHALL return a list identical in length and content to the original list.

**Validates: Requirements 4.2**

---

### Property 7: Task completion toggle is a round-trip

For any task list and any task `id` present in that list, applying `toggleTask` twice SHALL return a list where the targeted task's `done` value equals its original value, and all other tasks are unchanged.

**Validates: Requirements 4.3**

---

### Property 8: Task deletion removes exactly one task

For any task list containing a task with a given `id`, `deleteTask(tasks, id)` SHALL return a list of length `tasks.length - 1` that contains no task with that `id`, and all other tasks remain present and unchanged.

**Validates: Requirements 4.5**

---

### Property 9: Task list serialization round-trip

For any array of Task objects, `JSON.parse(JSON.stringify(tasks))` SHALL produce an array that is deeply equal to the original, preserving all `id`, `text`, and `done` fields.

**Validates: Requirements 4.7**

---

### Property 10: Adding a valid Quick Link grows the list by exactly one

For any links list and any non-empty label and non-empty URL, `addLink(links, label, url)` SHALL return a list whose length is exactly `links.length + 1`.

**Validates: Requirements 5.1**

---

### Property 11: Empty label or URL is rejected for Quick Links

For any links list, if either `label` or `url` is empty or whitespace-only, `addLink(links, label, url)` SHALL return a list identical in length and content to the original.

**Validates: Requirements 5.6**

---

### Property 12: Quick Link removal removes exactly one link

For any links list containing a link with a given `id`, `removeLink(links, id)` SHALL return a list of length `links.length - 1` that contains no link with that `id`, and all other links remain present and unchanged.

**Validates: Requirements 5.3**

---

### Property 13: Theme toggle is a round-trip

For any theme value `t` in `{"dark", "light"}`, toggling twice SHALL return to `t`. Toggling once SHALL return the opposite value.

**Validates: Requirements 6.2**
