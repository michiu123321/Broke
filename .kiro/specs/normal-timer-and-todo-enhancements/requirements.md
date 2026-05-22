# Requirements Document

## Introduction

This feature adds four enhancements to the existing Life Dashboard web application (vanilla HTML/CSS/JS, single-file architecture). The enhancements are:

1. **Normal Timer (Stopwatch)** — a count-up timer mode alongside the existing Pomodoro countdown timer, selectable via a tab/toggle within the same widget.
2. **Pomodoro Duration Setting** — the existing duration input and Set button are clearly labelled and reliably persist to localStorage.
3. **Duplicate Task Prevention** — the To-Do widget rejects tasks whose text matches an existing task (case-insensitive, trimmed) and shows a brief inline error message.
4. **Task Sorting** — a sort control above the task list lets the user choose from five sort orders; the preference persists to localStorage while the original insertion order is preserved internally.

All changes are confined to `index.html`, `CSS/style.css`, and `JS/app.js`. No frameworks, no additional files.

---

## Glossary

- **Dashboard**: The Life Dashboard single-page web application.
- **Timer_Widget**: The `<section id="timer-widget">` card that hosts both timer modes.
- **Pomodoro_Timer**: The existing countdown timer that counts down from a user-configured number of minutes to zero.
- **Normal_Timer**: The new count-up stopwatch that counts upward from 00:00:00.
- **Timer_Mode**: The currently active timer type — either `pomodoro` or `normal`.
- **Mode_Tab**: A clickable tab or toggle button that switches the active Timer_Mode.
- **Todo_Module**: The JavaScript module and `<section id="todo-widget">` that manages the task list.
- **Task**: An object `{ id, text, done, insertionOrder }` stored in localStorage under `dashboard_todos`.
- **Sort_Preference**: The user's chosen sort order, stored in localStorage under `dashboard_todo_sort`.
- **Duplicate**: A task whose `text`, after trimming whitespace and lowercasing, equals the trimmed-and-lowercased text of any existing task regardless of its `done` state.
- **Inline_Error**: A short text message rendered directly below the task input field, visible without a modal or alert.

---

## Requirements

### Requirement 1: Normal Timer (Stopwatch) Mode

**User Story:** As a user, I want a count-up stopwatch alongside the Pomodoro timer, so that I can track elapsed time without a fixed countdown.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display two Mode_Tabs labelled "Pomodoro" and "Stopwatch" that allow the user to switch Timer_Mode.
2. WHEN the user activates the "Stopwatch" Mode_Tab, THE Timer_Widget SHALL switch to Normal_Timer mode and display the elapsed time starting from `00:00:00`.
3. WHEN the user activates the "Pomodoro" Mode_Tab, THE Timer_Widget SHALL switch to Pomodoro_Timer mode and restore the Pomodoro countdown display.
4. WHILE Normal_Timer mode is active and the timer is running, THE Normal_Timer SHALL increment the displayed time by one second every 1000 ms.
5. WHEN the Start button is pressed in Normal_Timer mode, THE Normal_Timer SHALL begin counting up from its current elapsed value.
6. WHEN the Stop button is pressed in Normal_Timer mode, THE Normal_Timer SHALL pause counting without resetting the elapsed value.
7. WHEN the Reset button is pressed in Normal_Timer mode, THE Normal_Timer SHALL stop counting and reset the elapsed time to `00:00:00`.
8. THE Normal_Timer SHALL display elapsed time in `HH:MM:SS` format when the elapsed time is 1 hour or more, and in `MM:SS` format when less than 1 hour.
9. WHEN the user switches Timer_Mode, THE Dashboard SHALL stop any currently running timer interval before activating the new mode.
10. THE Dashboard SHALL persist the last active Timer_Mode to localStorage under the key `dashboard_timer_mode` and restore it on page load.

---

### Requirement 2: Pomodoro Duration Setting

**User Story:** As a user, I want to set and save my Pomodoro duration, so that the timer always starts at my preferred length.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a clearly labelled duration input and a "Set" button visible only when Pomodoro mode is active.
2. WHEN the user enters a whole number between 1 and 120 (inclusive) and activates the Set button or presses Enter in the duration input, THE Pomodoro_Timer SHALL reset to the new duration and THE Dashboard SHALL persist the value to localStorage under `dashboard_timer_duration`.
3. IF the user enters a value outside the range 1–120 or a non-numeric value, THEN THE Dashboard SHALL restore the duration input to the last valid stored value without changing the timer.
4. WHEN the page loads, THE Pomodoro_Timer SHALL initialise to the duration stored in localStorage, or 25 minutes if no value is stored.
5. WHILE Normal_Timer mode is active, THE Timer_Widget SHALL hide the duration input row so it does not appear for the stopwatch.

---

### Requirement 3: Prevent Duplicate Tasks

**User Story:** As a user, I want the app to prevent me from adding a task that already exists, so that my task list stays clean and free of duplicates.

#### Acceptance Criteria

1. WHEN the user submits the task form, THE Todo_Module SHALL compare the trimmed, lowercased input text against the trimmed, lowercased `text` field of every existing Task (both active and done).
2. IF a Duplicate is detected, THEN THE Todo_Module SHALL NOT add the new task and SHALL display an Inline_Error message reading "Task already exists" below the task input field.
3. WHEN an Inline_Error is displayed, THE Todo_Module SHALL automatically remove it after 2000 ms.
4. WHEN the user modifies the task input field while an Inline_Error is visible, THE Todo_Module SHALL immediately remove the Inline_Error.
5. IF no Duplicate is detected, THEN THE Todo_Module SHALL add the task normally and SHALL NOT display an Inline_Error.

---

### Requirement 4: Sort Tasks

**User Story:** As a user, I want to sort my task list in different orders, so that I can focus on what matters most at any given time.

#### Acceptance Criteria

1. THE Todo_Module SHALL display a sort control above the task list offering the following options: "Default" (insertion order), "Active first" (undone tasks before done tasks), "Done first" (done tasks before undone tasks), "A → Z" (ascending alphabetical by task text), "Z → A" (descending alphabetical by task text).
2. WHEN the user selects a sort option, THE Todo_Module SHALL re-render the task list in the chosen order without modifying the underlying insertion order of tasks in the stored array.
3. THE Todo_Module SHALL persist the selected Sort_Preference to localStorage under the key `dashboard_todo_sort` and restore it on page load.
4. WHEN the page loads, THE Todo_Module SHALL apply the stored Sort_Preference (or "Default" if none is stored) before rendering the task list.
5. WHEN a new task is added, THE Todo_Module SHALL append it at the end of the internal array (preserving insertion order) and then re-render using the current Sort_Preference.
6. WHEN a task is toggled, edited, or deleted, THE Todo_Module SHALL re-render the list using the current Sort_Preference.
7. THE Todo_Module SHALL assign a monotonically increasing `insertionOrder` integer to each new Task at creation time so that "Default" sort order is always reproducible.
