/**
 * Life Dashboard — app.js
 * Vanilla JS, no frameworks. All state in localStorage.
 *
 * Sections:
 *   1. Storage helpers
 *   2. Theme module
 *   3. Greeting module
 *   4. Timer module
 *   5. To-Do module
 *   6. Quick Links module
 *   7. init()
 */

'use strict';

/* ============================================================
   1. STORAGE HELPERS
   ============================================================ */

/**
 * Read a value from localStorage.
 * @param {string} key
 * @param {*} fallback  Returned when key is absent or JSON parse fails.
 * @returns {*}
 */
function storageGet(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

/**
 * Write a value to localStorage as JSON.
 * Silently fails when localStorage is unavailable (e.g. private browsing).
 * @param {string} key
 * @param {*} value
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // silently ignore
  }
}

/* ============================================================
   2. THEME MODULE
   ============================================================ */

/**
 * Toggle between 'dark' and 'light' themes.
 * Updates the data-theme attribute on <html> and persists to localStorage.
 */
function toggleTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  storageSet('dashboard_theme', next);
  updateThemeIcon(next);
}

/**
 * Update the theme toggle button icon to reflect the current theme.
 * @param {string} theme  'dark' | 'light'
 */
function updateThemeIcon(theme) {
  var icon = document.getElementById('theme-icon');
  if (icon) {
    // Show sun when in dark mode (clicking will switch to light), moon when in light mode
    icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/**
 * Initialize the theme module: wire the toggle button.
 */
function initTheme() {
  var current = document.documentElement.getAttribute('data-theme') || 'dark';
  updateThemeIcon(current);

  var btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }
}

/* ============================================================
   3. GREETING MODULE
   ============================================================ */

/**
 * Return the greeting prefix for a given hour (0–23).
 * @param {number} hour  Integer 0–23.
 * @returns {string}
 */
function getGreetingPrefix(hour) {
  if (hour >= 5 && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Build the full greeting string.
 * @param {number} hour  Integer 0–23.
 * @param {string} name  User's display name (may be empty).
 * @returns {string}
 */
function buildGreeting(hour, name) {
  var prefix = getGreetingPrefix(hour);
  var trimmed = name && name.trim ? name.trim() : '';
  return trimmed ? prefix + ', ' + trimmed + '!' : prefix;
}

/**
 * Format a Date object as "Monday, 26 May 2025".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Format a Date object as HH:MM:SS (24-hour).
 * @param {Date} date
 * @returns {string}
 */
function formatClockTime(date) {
  return date.toLocaleTimeString('en-GB', { hour12: false });
}

/** DOM refs for greeting */
var clockEl, dateEl, greetingTextEl, usernameDisplayEl, usernameInputEl;

/**
 * Update clock, date, and greeting text with the current time.
 */
function tickClock() {
  var now = new Date();
  if (clockEl) clockEl.textContent = formatClockTime(now);
  if (dateEl) dateEl.textContent = formatDate(now);
  if (greetingTextEl) {
    var name = storageGet('dashboard_username', '');
    greetingTextEl.textContent = buildGreeting(now.getHours(), name);
  }
}

/**
 * Switch the username display to an editable input.
 */
function startEditingName() {
  if (!usernameDisplayEl || !usernameInputEl) return;
  var current = storageGet('dashboard_username', '');
  usernameInputEl.value = current;
  usernameDisplayEl.classList.add('hidden');
  usernameInputEl.classList.remove('hidden');
  usernameInputEl.focus();
  usernameInputEl.select();
}

/**
 * Commit the edited name: save to localStorage and re-render.
 */
function commitName() {
  if (!usernameDisplayEl || !usernameInputEl) return;
  var newName = usernameInputEl.value.trim();
  storageSet('dashboard_username', newName);
  usernameInputEl.classList.add('hidden');
  usernameDisplayEl.classList.remove('hidden');
  // Update display immediately
  usernameDisplayEl.textContent = newName ? newName + '!' : '';
  tickClock();
}

/**
 * Initialize the greeting module.
 */
function initGreeting() {
  clockEl = document.getElementById('clock');
  dateEl = document.getElementById('date');
  greetingTextEl = document.getElementById('greeting-text');
  usernameDisplayEl = document.getElementById('username-display');
  usernameInputEl = document.getElementById('username-input');

  // Render stored name
  var storedName = storageGet('dashboard_username', '');
  if (usernameDisplayEl) {
    usernameDisplayEl.textContent = storedName ? storedName + '!' : '';
  }

  // Wire name editing
  if (usernameDisplayEl) {
    usernameDisplayEl.addEventListener('click', startEditingName);
    usernameDisplayEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEditingName();
      }
    });
  }

  if (usernameInputEl) {
    usernameInputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') commitName();
      if (e.key === 'Escape') {
        usernameInputEl.classList.add('hidden');
        usernameDisplayEl.classList.remove('hidden');
      }
    });
    usernameInputEl.addEventListener('blur', commitName);
  }

  // Start clock
  tickClock();
  setInterval(tickClock, 1000);
}

/* ============================================================
   4. TIMER MODULE  (Pomodoro countdown + Stopwatch)
   ============================================================ */

/** Shared timer state */
var timerInterval = null;
var remainingSeconds = 0;
var timerWidgetEl, timerDisplayEl;

/** Stopwatch state */
var swInterval = null;
var swElapsedSeconds = 0;
var swDisplayEl;

/**
 * Pomodoro mode durations in minutes.
 * Defaults: work=25, short-break=5, long-break=15.
 */
var POMO_DEFAULTS = { work: 25, 'short-break': 5, 'long-break': 15 };

/** Current pomodoro mode: 'work' | 'short-break' | 'long-break' */
var currentPomoMode = 'work';

/** Number of completed work sessions */
var pomoSessions = 0;

/* ---- Formatters ---- */

function formatCountdown(totalSeconds) {
  var s = Math.max(0, Math.floor(totalSeconds));
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

function formatStopwatch(totalSeconds) {
  var s = Math.max(0, Math.floor(totalSeconds));
  var h = Math.floor(s / 3600);
  var m = Math.floor((s % 3600) / 60);
  var sec = s % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

/* ---- Pomodoro helpers ---- */

/**
 * Return the stored duration (minutes) for a given mode.
 * @param {string} mode
 * @returns {number}
 */
function getModeDuration(mode) {
  return storageGet('dashboard_pomo_' + mode, POMO_DEFAULTS[mode] || 25);
}

/**
 * Apply a pomodoro mode: update buttons, widget colour, timer display.
 * Does NOT start the timer.
 * @param {string} mode  'work' | 'short-break' | 'long-break'
 */
function applyPomoMode(mode) {
  currentPomoMode = mode;
  stopTimer();

  // Update mode button states
  var modeBtns = document.querySelectorAll('.pomo__mode-btn');
  modeBtns.forEach(function (btn) {
    var active = btn.getAttribute('data-mode') === mode;
    btn.classList.toggle('pomo__mode-btn--active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  // Update widget colour class
  if (timerWidgetEl) {
    timerWidgetEl.classList.remove('pomo--work', 'pomo--short-break', 'pomo--long-break', 'timer--done');
    timerWidgetEl.classList.add('pomo--' + mode);
  }

  // Load duration for this mode
  var minutes = getModeDuration(mode);
  remainingSeconds = minutes * 60;

  // Sync custom input to current mode's duration
  var durationInput = document.getElementById('timer-duration-input');
  if (durationInput) durationInput.value = minutes;

  renderTimer();
}

/**
 * Increment session counter (called when a work session completes).
 */
function incrementSessions() {
  pomoSessions++;
  storageSet('dashboard_pomo_sessions', pomoSessions);
  var el = document.getElementById('pomo-session-count');
  if (el) el.textContent = String(pomoSessions);
}

/* ---- Pomodoro countdown ---- */

function renderTimer() {
  if (timerDisplayEl) {
    timerDisplayEl.textContent = formatCountdown(remainingSeconds);
  }
}

function startTimer() {
  if (timerInterval !== null) return;
  if (remainingSeconds <= 0) return;
  if (timerWidgetEl) timerWidgetEl.classList.remove('timer--done');
  timerInterval = setInterval(function () {
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
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetTimer() {
  stopTimer();
  var minutes = getModeDuration(currentPomoMode);
  remainingSeconds = minutes * 60;
  if (timerWidgetEl) timerWidgetEl.classList.remove('timer--done');
  renderTimer();
}

function triggerTimerAlert() {
  if (timerWidgetEl) timerWidgetEl.classList.add('timer--done');

  // Count completed work sessions
  if (currentPomoMode === 'work') {
    incrementSessions();
  }

  // Audible beep
  try {
    var AudioCtx = window.AudioContext || (window).webkitAudioContext;
    if (AudioCtx) {
      var ctx = new AudioCtx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    }
  } catch (e) { /* visual alert still fires */ }
}

/* ---- Stopwatch ---- */

function renderStopwatch() {
  if (swDisplayEl) {
    swDisplayEl.textContent = formatStopwatch(swElapsedSeconds);
  }
}

function startStopwatch() {
  if (swInterval !== null) return;
  swInterval = setInterval(function () {
    swElapsedSeconds++;
    renderStopwatch();
  }, 1000);
}

function stopStopwatch() {
  if (swInterval !== null) {
    clearInterval(swInterval);
    swInterval = null;
  }
}

function resetStopwatch() {
  stopStopwatch();
  swElapsedSeconds = 0;
  renderStopwatch();
}

/* ---- Tab switching (Pomodoro ↔ Stopwatch) ---- */

function switchTimerTab(mode) {
  var pomodoroPanel = document.getElementById('panel-pomodoro');
  var stopwatchPanel = document.getElementById('panel-stopwatch');
  var tabPomodoro   = document.getElementById('tab-pomodoro');
  var tabStopwatch  = document.getElementById('tab-stopwatch');

  if (mode === 'stopwatch') {
    pomodoroPanel.classList.add('hidden');
    stopwatchPanel.classList.remove('hidden');
    tabPomodoro.classList.remove('timer__tab--active');
    tabPomodoro.setAttribute('aria-selected', 'false');
    tabStopwatch.classList.add('timer__tab--active');
    tabStopwatch.setAttribute('aria-selected', 'true');
    stopTimer();
  } else {
    stopwatchPanel.classList.add('hidden');
    pomodoroPanel.classList.remove('hidden');
    tabStopwatch.classList.remove('timer__tab--active');
    tabStopwatch.setAttribute('aria-selected', 'false');
    tabPomodoro.classList.add('timer__tab--active');
    tabPomodoro.setAttribute('aria-selected', 'true');
    stopStopwatch();
  }
}

/**
 * Initialize the timer module.
 */
function initTimer() {
  timerWidgetEl  = document.getElementById('timer-widget');
  timerDisplayEl = document.getElementById('timer-display');
  swDisplayEl    = document.getElementById('stopwatch-display');

  var startBtn      = document.getElementById('timer-start');
  var stopBtn       = document.getElementById('timer-stop');
  var resetBtn      = document.getElementById('timer-reset');
  var durationInput = document.getElementById('timer-duration-input');
  var durationSetBtn = document.getElementById('timer-duration-set');

  // Restore session count
  pomoSessions = storageGet('dashboard_pomo_sessions', 0);
  var sessionCountEl = document.getElementById('pomo-session-count');
  if (sessionCountEl) sessionCountEl.textContent = String(pomoSessions);

  // Apply default mode (work) — sets remainingSeconds and syncs display
  applyPomoMode('work');
  renderStopwatch();

  // Pomodoro controls
  if (startBtn) startBtn.addEventListener('click', startTimer);
  if (stopBtn)  stopBtn.addEventListener('click',  stopTimer);
  if (resetBtn) resetBtn.addEventListener('click', resetTimer);

  // Mode buttons
  var modeBtns = document.querySelectorAll('.pomo__mode-btn');
  modeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyPomoMode(btn.getAttribute('data-mode'));
    });
  });

  // Session reset button
  var sessionResetBtn = document.getElementById('pomo-session-reset');
  if (sessionResetBtn) {
    sessionResetBtn.addEventListener('click', function () {
      pomoSessions = 0;
      storageSet('dashboard_pomo_sessions', 0);
      var el = document.getElementById('pomo-session-count');
      if (el) el.textContent = '0';
    });
  }

  // Custom duration — applies to the currently active mode
  function applyDuration() {
    var val = parseInt(durationInput ? durationInput.value : '25', 10);
    if (!isNaN(val) && val >= 1 && val <= 120) {
      storageSet('dashboard_pomo_' + currentPomoMode, val);
      remainingSeconds = val * 60;
      stopTimer();
      if (timerWidgetEl) timerWidgetEl.classList.remove('timer--done');
      renderTimer();
    } else if (durationInput) {
      durationInput.value = getModeDuration(currentPomoMode);
    }
  }

  if (durationSetBtn) durationSetBtn.addEventListener('click', applyDuration);
  if (durationInput) {
    durationInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') applyDuration();
    });
  }

  // Stopwatch controls
  var swStart = document.getElementById('sw-start');
  var swStop  = document.getElementById('sw-stop');
  var swReset = document.getElementById('sw-reset');
  if (swStart) swStart.addEventListener('click', startStopwatch);
  if (swStop)  swStop.addEventListener('click',  stopStopwatch);
  if (swReset) swReset.addEventListener('click', resetStopwatch);

  // Tab switching
  var tabPomodoro  = document.getElementById('tab-pomodoro');
  var tabStopwatch = document.getElementById('tab-stopwatch');
  if (tabPomodoro)  tabPomodoro.addEventListener('click',  function () { switchTimerTab('pomodoro'); });
  if (tabStopwatch) tabStopwatch.addEventListener('click', function () { switchTimerTab('stopwatch'); });
}

/* ============================================================
   5. TO-DO MODULE
   ============================================================ */

/**
 * Create a new Task object.
 * @param {string} text
 * @returns {{ id: string, text: string, done: boolean }}
 */
function createTask(text) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    text: text.trim(),
    done: false
  };
}

/**
 * Check if a task with the same text already exists (case-insensitive).
 * @param {Array} tasks
 * @param {string} text
 * @returns {boolean}
 */
function isDuplicateTask(tasks, text) {
  var normalized = text.trim().toLowerCase();
  return tasks.some(function (t) {
    return t.text.toLowerCase() === normalized;
  });
}

/**
 * Add a task to the list. Rejects empty/whitespace text and duplicates.
 * Returns { tasks, duplicate } where duplicate is true if rejected as duplicate.
 * @param {Array} tasks
 * @param {string} text
 * @returns {{ tasks: Array, duplicate: boolean }}
 */
function addTask(tasks, text) {
  if (!text || !text.trim()) return { tasks: tasks, duplicate: false };
  if (isDuplicateTask(tasks, text)) return { tasks: tasks, duplicate: true };
  return { tasks: tasks.concat([createTask(text)]), duplicate: false };
}

/**
 * Toggle the done state of a task by id.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function toggleTask(tasks, id) {
  return tasks.map(function (t) {
    return t.id === id ? Object.assign({}, t, { done: !t.done }) : t;
  });
}

/**
 * Edit the text of a task by id. Rejects empty/whitespace new text.
 * @param {Array} tasks
 * @param {string} id
 * @param {string} newText
 * @returns {Array}
 */
function editTask(tasks, id, newText) {
  if (!newText || !newText.trim()) return tasks;
  return tasks.map(function (t) {
    return t.id === id ? Object.assign({}, t, { text: newText.trim() }) : t;
  });
}

/**
 * Delete a task by id.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function deleteTask(tasks, id) {
  return tasks.filter(function (t) { return t.id !== id; });
}

/**
 * Return a sorted copy of tasks based on the given sort key.
 * Original array is not mutated.
 * @param {Array} tasks
 * @param {string} sortKey  'default' | 'az' | 'za' | 'pending' | 'done'
 * @returns {Array}
 */
function sortedTasks(tasks, sortKey) {
  var copy = tasks.slice();
  if (sortKey === 'az') {
    copy.sort(function (a, b) { return a.text.toLowerCase().localeCompare(b.text.toLowerCase()); });
  } else if (sortKey === 'za') {
    copy.sort(function (a, b) { return b.text.toLowerCase().localeCompare(a.text.toLowerCase()); });
  } else if (sortKey === 'pending') {
    copy.sort(function (a, b) { return (a.done === b.done) ? 0 : a.done ? 1 : -1; });
  } else if (sortKey === 'done') {
    copy.sort(function (a, b) { return (a.done === b.done) ? 0 : a.done ? -1 : 1; });
  }
  // 'default' — no sort, preserve insertion order
  return copy;
}

/** Module state */
var todos = [];
var todoListEl;
var currentSortKey = 'default';

/**
 * Persist the current todos array to localStorage.
 */
function saveTodos() {
  storageSet('dashboard_todos', todos);
}

/**
 * Show or hide the duplicate warning message.
 * Auto-hides after 2.5 seconds.
 * @param {boolean} show
 */
var duplicateMsgTimer = null;
function showDuplicateWarning(show) {
  var msg = document.getElementById('todo-duplicate-msg');
  if (!msg) return;
  if (show) {
    msg.classList.remove('hidden');
    if (duplicateMsgTimer) clearTimeout(duplicateMsgTimer);
    duplicateMsgTimer = setTimeout(function () {
      msg.classList.add('hidden');
      duplicateMsgTimer = null;
    }, 2500);
  } else {
    msg.classList.add('hidden');
    if (duplicateMsgTimer) { clearTimeout(duplicateMsgTimer); duplicateMsgTimer = null; }
  }
}

/**
 * Build a <li> element for a single task.
 * @param {{ id: string, text: string, done: boolean }} task
 * @returns {HTMLLIElement}
 */
function buildTaskElement(task) {
  var li = document.createElement('li');
  li.className = 'task' + (task.done ? ' task--done' : '');
  li.setAttribute('data-id', task.id);

  // Toggle button
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'task__toggle';
  toggleBtn.setAttribute('aria-label', task.done ? 'Mark as not done' : 'Mark as done');
  toggleBtn.setAttribute('title', task.done ? 'Mark as not done' : 'Mark as done');
  toggleBtn.textContent = '✓';
  toggleBtn.addEventListener('click', function () {
    todos = toggleTask(todos, task.id);
    saveTodos();
    renderTodos();
  });

  // Text span
  var textSpan = document.createElement('span');
  textSpan.className = 'task__text';
  textSpan.textContent = task.text;

  // Actions container
  var actions = document.createElement('div');
  actions.className = 'task__actions';

  // Edit button
  var editBtn = document.createElement('button');
  editBtn.className = 'btn btn--icon';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.setAttribute('title', 'Edit task');
  editBtn.textContent = '✎';
  editBtn.addEventListener('click', function () {
    var input = document.createElement('input');
    input.className = 'task__edit-input';
    input.type = 'text';
    input.value = task.text;
    input.maxLength = 200;
    input.setAttribute('aria-label', 'Edit task text');

    function commitEdit() {
      var newText = input.value;
      todos = editTask(todos, task.id, newText);
      saveTodos();
      renderTodos();
    }

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') commitEdit();
      if (e.key === 'Escape') renderTodos();
    });
    input.addEventListener('blur', commitEdit);

    li.replaceChild(input, textSpan);
    input.focus();
    input.select();
  });

  // Delete button
  var deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--icon btn--danger';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.setAttribute('title', 'Delete task');
  deleteBtn.textContent = '✕';
  deleteBtn.addEventListener('click', function () {
    todos = deleteTask(todos, task.id);
    saveTodos();
    renderTodos();
  });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(toggleBtn);
  li.appendChild(textSpan);
  li.appendChild(actions);

  return li;
}

/**
 * Re-render the entire todo list from the todos array, applying current sort.
 */
function renderTodos() {
  if (!todoListEl) return;
  todoListEl.innerHTML = '';
  var displayed = sortedTasks(todos, currentSortKey);
  displayed.forEach(function (task) {
    todoListEl.appendChild(buildTaskElement(task));
  });
}

/**
 * Initialize the To-Do module.
 */
function initTodos() {
  todoListEl = document.getElementById('todo-list');
  var form = document.getElementById('todo-form');
  var input = document.getElementById('todo-input');
  var sortSelect = document.getElementById('todo-sort');

  // Load from localStorage
  todos = storageGet('dashboard_todos', []);
  currentSortKey = storageGet('dashboard_todo_sort', 'default');
  if (sortSelect) sortSelect.value = currentSortKey;
  renderTodos();

  // Sort change
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentSortKey = sortSelect.value;
      storageSet('dashboard_todo_sort', currentSortKey);
      renderTodos();
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input ? input.value : '';
      var result = addTask(todos, text);
      if (result.duplicate) {
        showDuplicateWarning(true);
        if (input) { input.select(); }
        return;
      }
      showDuplicateWarning(false);
      if (result.tasks.length !== todos.length) {
        todos = result.tasks;
        saveTodos();
        renderTodos();
        if (input) {
          input.value = '';
          input.focus();
        }
      }
    });
  }
}

/* ============================================================
   6. QUICK LINKS MODULE
   ============================================================ */

/**
 * Create a new Link object.
 * @param {string} label
 * @param {string} url
 * @returns {{ id: string, label: string, url: string }}
 */
function createLink(label, url) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    label: label.trim(),
    url: url.trim()
  };
}

/**
 * Add a link to the list. Rejects empty label or URL.
 * @param {Array} links
 * @param {string} label
 * @param {string} url
 * @returns {Array}
 */
function addLink(links, label, url) {
  if (!label || !label.trim() || !url || !url.trim()) return links;
  return links.concat([createLink(label, url)]);
}

/**
 * Remove a link by id.
 * @param {Array} links
 * @param {string} id
 * @returns {Array}
 */
function removeLink(links, id) {
  return links.filter(function (l) { return l.id !== id; });
}

/** Module state */
var links = [];
var linksListEl;

/**
 * Persist the current links array to localStorage.
 */
function saveLinks() {
  storageSet('dashboard_links', links);
}

/**
 * Build a DOM element for a single quick link.
 * @param {{ id: string, label: string, url: string }} link
 * @returns {HTMLDivElement}
 */
function buildLinkElement(link) {
  var wrapper = document.createElement('div');
  wrapper.className = 'link-item';
  wrapper.setAttribute('data-id', link.id);

  // Ensure URL has a protocol
  var href = link.url;
  if (href && !/^https?:\/\//i.test(href)) {
    href = 'https://' + href;
  }

  var anchor = document.createElement('a');
  anchor.className = 'link-item__btn';
  anchor.href = href;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.textContent = link.label;

  var removeBtn = document.createElement('button');
  removeBtn.className = 'link-item__remove';
  removeBtn.setAttribute('aria-label', 'Remove ' + link.label);
  removeBtn.setAttribute('title', 'Remove link');
  removeBtn.textContent = '✕';
  removeBtn.addEventListener('click', function () {
    links = removeLink(links, link.id);
    saveLinks();
    renderLinks();
  });

  wrapper.appendChild(anchor);
  wrapper.appendChild(removeBtn);
  return wrapper;
}

/**
 * Re-render the links list.
 */
function renderLinks() {
  if (!linksListEl) return;
  linksListEl.innerHTML = '';
  links.forEach(function (link) {
    linksListEl.appendChild(buildLinkElement(link));
  });
}

/**
 * Initialize the Quick Links module.
 */
function initLinks() {
  linksListEl = document.getElementById('links-list');
  var form = document.getElementById('links-form');
  var labelInput = document.getElementById('links-label-input');
  var urlInput = document.getElementById('links-url-input');

  // Load from localStorage
  links = storageGet('dashboard_links', []);
  renderLinks();

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var label = labelInput ? labelInput.value : '';
      var url = urlInput ? urlInput.value : '';
      var updated = addLink(links, label, url);
      if (updated.length !== links.length) {
        links = updated;
        saveLinks();
        renderLinks();
        if (labelInput) labelInput.value = '';
        if (urlInput) urlInput.value = '';
        if (labelInput) labelInput.focus();
      }
    });
  }
}

/* ============================================================
   7. INIT
   ============================================================ */

/**
 * Bootstrap all modules once the DOM is ready.
 */
function init() {
  initTheme();
  initGreeting();
  initTimer();
  initTodos();
  initLinks();
}

document.addEventListener('DOMContentLoaded', init);