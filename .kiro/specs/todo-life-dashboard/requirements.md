# Requirements Document

## Introduction

A personal life dashboard — a single-page web application built with vanilla HTML, CSS, and JavaScript. The app runs entirely in the browser with no backend; all data is persisted in `localStorage`. It provides five core widgets: a greeting with live clock, a Pomodoro focus timer, a flat to-do list, a quick-links launcher, and a light/dark theme toggle. The default theme is dark mode. The entry point is `index.html`, with styles in `css/style.css` and logic in `js/app.js`.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Widget**: A self-contained UI section within the Dashboard (Greeting, Timer, To-Do List, Quick Links, Theme Toggle).
- **LocalStorage**: The browser's `localStorage` API used for all client-side data persistence.
- **Pomodoro Timer**: A countdown timer defaulting to 25 minutes, used to structure focused work sessions.
- **Task**: A to-do item with a text description and a completion state (done / not done).
- **Quick Link**: A user-defined label and URL pair rendered as a clickable button.
- **Theme**: The visual color scheme of the Dashboard — either dark (default) or light.
- **User Name**: A customizable display name shown in the greeting, stored in LocalStorage.

---

## Requirements

### Requirement 1 — Project Structure and Technical Constraints

**User Story:** As a developer, I want the project to follow a strict file structure and use only vanilla web technologies, so that the app is simple to open and maintain without any build tools.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using only HTML, CSS, and vanilla JavaScript — no frameworks, libraries, or transpilers.
2. THE Dashboard SHALL consist of exactly three files: `index.html`, `css/style.css`, and `js/app.js`.
3. THE Dashboard SHALL function correctly in modern versions of Chrome, Firefox, Edge, and Safari without any installation step.
4. THE Dashboard SHALL use `localStorage` as the sole persistence mechanism — no cookies, no IndexedDB, no remote API calls.

---

### Requirement 2 — Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a personalized greeting when I open the dashboard, so that I feel welcomed and oriented.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Greeting Widget SHALL display the current time in HH:MM:SS format, updating every second.
2. WHEN the Dashboard loads, THE Greeting Widget SHALL display the current date in a human-readable format (e.g., "Monday, 26 May 2025").
3. WHEN the current hour is between 05:00 and 11:59 (inclusive), THE Greeting Widget SHALL display "Good morning".
4. WHEN the current hour is between 12:00 and 17:59 (inclusive), THE Greeting Widget SHALL display "Good afternoon".
5. WHEN the current hour is between 18:00 and 23:59 or between 00:00 and 04:59 (inclusive), THE Greeting Widget SHALL display "Good evening".
6. THE Greeting Widget SHALL append the stored User Name to the greeting message (e.g., "Good morning, Michelle!").
7. WHEN a user edits the User Name field and confirms the change, THE Greeting Widget SHALL save the new name to LocalStorage and update the displayed greeting immediately.
8. IF no User Name is stored in LocalStorage, THE Greeting Widget SHALL display the greeting without a name suffix.

---

### Requirement 3 — Focus Timer Widget (Pomodoro)

**User Story:** As a user, I want a configurable countdown timer so that I can structure my work into focused sessions.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus Timer Widget SHALL display a countdown initialized to the stored duration, or 25 minutes if no duration has been saved.
2. WHEN a user clicks the Start button, THE Focus Timer Widget SHALL begin counting down one second at a time.
3. WHEN a user clicks the Stop button, THE Focus Timer Widget SHALL pause the countdown at the current remaining time.
4. WHEN a user clicks the Reset button, THE Focus Timer Widget SHALL restore the countdown to the stored duration without starting it.
5. WHEN the countdown reaches 00:00, THE Focus Timer Widget SHALL stop automatically and display a visual alert (e.g., a highlighted border or color change) and play an audible alert using the Web Audio API.
6. WHEN a user changes the timer duration and confirms the change, THE Focus Timer Widget SHALL save the new duration (in minutes) to LocalStorage and reset the display to the new duration.
7. THE Focus Timer Widget SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 4 — To-Do List Widget

**User Story:** As a user, I want to manage a flat list of tasks so that I can track what I need to do and what I have completed.

#### Acceptance Criteria

1. WHEN a user types a task description and submits it (via Enter key or Add button), THE To-Do List Widget SHALL create a new Task and append it to the list.
2. WHEN a user attempts to submit an empty or whitespace-only task description, THE To-Do List Widget SHALL reject the submission and leave the list unchanged.
3. WHEN a user clicks the complete toggle on a Task, THE To-Do List Widget SHALL toggle the Task's completion state and apply a visual distinction (e.g., strikethrough) to completed tasks.
4. WHEN a user clicks the edit control on a Task, THE To-Do List Widget SHALL allow the user to modify the Task's description inline and save the change on confirmation.
5. WHEN a user clicks the delete control on a Task, THE To-Do List Widget SHALL remove the Task from the list permanently.
6. WHEN any Task is added, edited, toggled, or deleted, THE To-Do List Widget SHALL persist the updated task list to LocalStorage immediately.
7. WHEN the Dashboard loads, THE To-Do List Widget SHALL restore all Tasks from LocalStorage and render them in their saved state.

---

### Requirement 5 — Quick Links Widget

**User Story:** As a user, I want to save and launch my favorite websites from the dashboard so that I can navigate quickly without typing URLs.

#### Acceptance Criteria

1. WHEN a user provides a label and a URL and submits the form, THE Quick Links Widget SHALL add a new Quick Link button to the widget.
2. WHEN a user clicks a Quick Link button, THE Quick Links Widget SHALL open the associated URL in a new browser tab.
3. WHEN a user clicks the remove control on a Quick Link, THE Quick Links Widget SHALL delete that Quick Link from the list.
4. WHEN any Quick Link is added or removed, THE Quick Links Widget SHALL persist the updated links list to LocalStorage immediately.
5. WHEN the Dashboard loads, THE Quick Links Widget SHALL restore all Quick Links from LocalStorage and render them as buttons.
6. IF a user submits a Quick Link with an empty label or an empty URL, THE Quick Links Widget SHALL reject the submission and leave the list unchanged.

---

### Requirement 6 — Light / Dark Theme Toggle

**User Story:** As a user, I want to switch between a light and dark theme so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN the Dashboard loads for the first time with no theme stored in LocalStorage, THE Theme Toggle SHALL apply the dark theme by default.
2. WHEN a user clicks the theme toggle control, THE Theme Toggle SHALL switch the active theme between dark and light.
3. WHEN the theme changes, THE Theme Toggle SHALL persist the new theme preference to LocalStorage immediately.
4. WHEN the Dashboard loads and a theme preference is stored in LocalStorage, THE Theme Toggle SHALL apply the stored theme without any flash of the opposite theme.

---

### Requirement 7 — General UX and Performance

**User Story:** As a user, I want the dashboard to be fast, visually clean, and easy to use without any setup, so that it feels like a polished personal tool.

#### Acceptance Criteria

1. THE Dashboard SHALL render all widgets and apply the correct theme before the first user interaction is possible (no layout shift or theme flash on load).
2. THE Dashboard SHALL be responsive and usable on screen widths from 320px to 2560px.
3. THE Dashboard SHALL use a clear visual hierarchy with readable typography — minimum body font size of 14px.
4. THE Dashboard SHALL provide visible focus indicators on all interactive elements for keyboard accessibility.
5. WHEN a user interacts with any widget control, THE Dashboard SHALL reflect the change in the UI within 100ms.
