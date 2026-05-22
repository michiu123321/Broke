# Implementation Plan: To-Do List Life Dashboard

## Overview

Build a single-page personal life dashboard using only vanilla HTML, CSS, and JavaScript. All state is persisted in `localStorage`. The app consists of three files: `index.html`, `css/style.css`, and `js/app.js`. Implementation proceeds widget by widget, wiring everything together at the end.

## Tasks

- [ ] 1. Set up project structure and HTML skeleton
  - Create `index.html` with semantic markup for all five widgets: Greeting, Focus Timer, To-Do List, Quick Links, and Theme Toggle
  - Add the inline `<script>` in `<head>` that reads `localStorage` and sets `data-theme` on `<html>` before first paint (prevents theme flash)
  - Link `css/style.css` and `js/app.js` in the correct positions (`<link>` in `<head>`, `<script>` before `</body>`)
  - Create empty `css/style.css` and `js/app.js` files
  - _Requirements: 1.1, 1.2, 6.4_

- [ ] 2. Implement CSS theming and base layout
  - [ ] 2.1 Define CSS custom properties for dark and light themes using `[data-theme]` attribute selectors on `:root`
    - Dark theme variables: `--bg-primary`, `--bg-secondary`, `--bg-widget`, `--text-primary`, `--text-secondary`, `--accent`, `--border`
    - Light theme variables with the same property names
    - _Requirements: 6.1, 6.2_
  - [ ] 2.2 Implement responsive dashboard grid layout
    - Two-column CSS Grid on screens ≥ 768px, single column on smaller screens
    - Widget card styles with padding, border-radius, and border using CSS variables
    - Base typography: minimum 14px body font, clear visual hierarchy with heading sizes
    - Visible focus indicators on all interactive elements (`:focus-visible` outline)
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 3. Implement Storage helpers and Theme module in `app.js`
  - [ ] 3.1 Write `storageGet(key, fallback)` and `storageSet(key, value)` with `try/catch` error handling
    - `storageGet` returns `fallback` if key is absent or JSON parse fails
    - `storageSet` silently fails if `localStorage` is unavailable
    - _Requirements: 1.4_
  - [ ] 3.2 Implement `toggleTheme()` function
    - Reads current `data-theme` from `document.documentElement`
    - Sets the opposite value and calls `storageSet('dashboard_theme', next)`
    - Wire the theme toggle button's click event to `toggleTheme()`
    - _Requirements: 6.2, 6.3_
  - [ ]* 3.3 Write property test for theme toggle round-trip
    - **Property 13: Theme toggle is a round-trip**
    - **Validates: Requirements 6.2**

- [ ] 4. Implement Greeting Widget
  - [ ] 4.1 Implement pure helper functions: `getGreetingPrefix(hour)`, `buildGreeting(hour, name)`, `formatDate(date)`, `formatTime(date)`
    - `getGreetingPrefix`: returns "Good morning" for hours 5–11, "Good afternoon" for 12–17, "Good evening" for all others
    - `buildGreeting`: appends name if non-empty/non-whitespace
    - `formatDate`: returns human-readable date string (e.g., "Monday, 26 May 2025")
    - `formatTime`: returns HH:MM:SS string
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8_
  - [ ]* 4.2 Write property test for greeting prefix exhaustiveness
    - **Property 1: Greeting prefix covers all hours**
    - **Validates: Requirements 2.3, 2.4, 2.5**
  - [ ]* 4.3 Write property test for greeting name inclusion
    - **Property 2: Greeting includes name when name is non-empty**
    - **Validates: Requirements 2.6, 2.8**
  - [ ]* 4.4 Write property test for date format components
    - **Property 3: Date format contains required components**
    - **Validates: Requirements 2.2**
  - [ ] 4.5 Implement clock tick and name editing
    - Start `setInterval` calling `tickClock()` every 1000ms on init
    - Render name as an editable inline element; on Enter or blur, save to `localStorage` and re-render greeting
    - _Requirements: 2.1, 2.7_

- [ ] 5. Checkpoint — Greeting and theme working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Focus Timer Widget
  - [ ] 6.1 Implement `formatCountdown(totalSeconds)` pure helper
    - Returns `"MM:SS"` string with zero-padded minutes and seconds
    - _Requirements: 3.7_
  - [ ]* 6.2 Write property test for countdown format
    - **Property 4: Timer countdown format is always MM:SS**
    - **Validates: Requirements 3.7**
  - [ ] 6.3 Implement timer state and controls: `startTimer()`, `stopTimer()`, `resetTimer()`
    - `startTimer`: guard against double-interval; decrement `remainingSeconds` each tick; call `triggerTimerAlert()` at zero
    - `stopTimer`: clears interval
    - `resetTimer`: stops and restores `remainingSeconds` from stored duration
    - _Requirements: 3.2, 3.3, 3.4_
  - [ ] 6.4 Implement `triggerTimerAlert()`
    - Apply CSS class `timer--done` to the timer widget for visual highlight
    - Use Web Audio API to play a 1-second 880Hz beep; wrap in `try/catch` for browsers without AudioContext
    - _Requirements: 3.5_
  - [ ] 6.5 Implement duration editing
    - Render an editable duration input; on confirm, validate it is a positive integer, save to `localStorage`, and call `resetTimer()`
    - _Requirements: 3.6_
  - [ ] 6.6 Wire Start, Stop, Reset buttons to their respective functions and initialize timer display on load
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. Implement To-Do List Widget
  - [ ] 7.1 Implement pure task helper functions: `addTask(tasks, text)`, `toggleTask(tasks, id)`, `editTask(tasks, id, newText)`, `deleteTask(tasks, id)`
    - `addTask`: rejects empty/whitespace text; returns new array with appended task
    - `toggleTask`: flips `done` on matching task; all others unchanged
    - `editTask`: updates `text` on matching task; rejects empty/whitespace new text
    - `deleteTask`: filters out matching task; all others unchanged
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  - [ ]* 7.2 Write property test for adding a valid task
    - **Property 5: Adding a valid task grows the list by exactly one**
    - **Validates: Requirements 4.1**
  - [ ]* 7.3 Write property test for whitespace task rejection
    - **Property 6: Whitespace-only task submission is rejected**
    - **Validates: Requirements 4.2**
  - [ ]* 7.4 Write property test for toggle round-trip
    - **Property 7: Task completion toggle is a round-trip**
    - **Validates: Requirements 4.3**
  - [ ]* 7.5 Write property test for task deletion
    - **Property 8: Task deletion removes exactly one task**
    - **Validates: Requirements 4.5**
  - [ ]* 7.6 Write property test for task list serialization round-trip
    - **Property 9: Task list serialization round-trip**
    - **Validates: Requirements 4.7**
  - [ ] 7.7 Implement `renderTodos()` and task DOM element builder
    - Each task renders with toggle, text, edit, and delete controls
    - Completed tasks get a `task--done` CSS class (strikethrough style)
    - Inline edit: clicking edit replaces `<span>` with `<input>`; confirm on Enter or blur
    - _Requirements: 4.3, 4.4_
  - [ ] 7.8 Wire add-task form, load todos from `localStorage` on init, and persist on every change
    - _Requirements: 4.6, 4.7_

- [ ] 8. Checkpoint — Timer and To-Do List working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Quick Links Widget
  - [ ] 9.1 Implement pure link helper functions: `addLink(links, label, url)`, `removeLink(links, id)`
    - `addLink`: rejects empty/whitespace label or URL; returns new array with appended link
    - `removeLink`: filters out matching link; all others unchanged
    - _Requirements: 5.1, 5.3, 5.6_
  - [ ]* 9.2 Write property test for adding a valid Quick Link
    - **Property 10: Adding a valid Quick Link grows the list by exactly one**
    - **Validates: Requirements 5.1**
  - [ ]* 9.3 Write property test for empty label/URL rejection
    - **Property 11: Empty label or URL is rejected for Quick Links**
    - **Validates: Requirements 5.6**
  - [ ]* 9.4 Write property test for Quick Link removal
    - **Property 12: Quick Link removal removes exactly one link**
    - **Validates: Requirements 5.3**
  - [ ] 9.5 Implement `renderLinks()` and link DOM element builder
    - Each link renders as an `<a>` button opening in a new tab (`target="_blank" rel="noopener noreferrer"`) plus a remove button
    - _Requirements: 5.2_
  - [ ] 9.6 Wire add-link form, load links from `localStorage` on init, and persist on every change
    - _Requirements: 5.4, 5.5_

- [ ] 10. Wire everything together in `init()` and polish
  - [ ] 10.1 Write the `init()` function called on `DOMContentLoaded`
    - Call each module's init/load function in order: theme, greeting (start clock), timer (load duration), todos (load and render), links (load and render)
    - _Requirements: 1.3, 7.1_
  - [ ] 10.2 Apply final CSS polish
    - Smooth theme transition (`transition: background-color 0.2s, color 0.2s`)
    - Responsive widget sizing and spacing
    - `timer--done` highlight style (e.g., accent-colored border pulse animation)
    - Strikethrough and muted color for completed tasks
    - Hover and active states for all buttons
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 11. Final checkpoint — Full application working end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All pure helper functions (greeting, timer format, task operations, link operations) are designed to be tested in isolation without a DOM
- The inline theme script in `<head>` is critical — it must run before `css/style.css` is applied to prevent a flash of the wrong theme
- The Web Audio API beep is wrapped in `try/catch` so the timer still works in environments where `AudioContext` is blocked
