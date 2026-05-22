# Requirements Document

## Introduction

This document covers two enhancements to the Life Dashboard web application:

1. **Normal Timer (Stopwatch mode)** — extends the existing Focus Timer widget with a count-up stopwatch mode alongside the existing Pomodoro countdown mode. Users can toggle between modes within the same widget, and their preference is persisted across sessions.

2. **Duplicate Task Prevention** — prevents users from adding a task whose text (case-insensitive, trimmed) already exists in the To-Do list. Feedback is delivered purely through visual cues: the input field shakes/highlights and the existing matching task is briefly highlighted. No dialog boxes are used.

The application is a single-page vanilla HTML/CSS/JS dashboard with all state stored in `localStorage`. No frameworks, no additional files.

---

## Glossary

- **Dashboard**: The Life Dashboard single-page web application (`index.html`).
- **Timer_Widget**: The existing `#timer-widget` section that contains the Focus Timer UI.
- **Timer_Module**: The JavaScript logic in `js/app.js` responsible for timer state and rendering.
- **Countdown_Mode**: The existing Pomodoro-style timer that counts down from a user-specified duration to zero.
- **Stopwatch_Mode**: The new count-up timer that counts elapsed time upward from 00:00.
- **Mode_Toggle**: The UI control (button or segmented control) that switches the Timer_Widget between Countdown_Mode and Stopwatch_Mode.
- **Duration_Row**: The `div.timer__duration-row` element containing the duration label, number input, and Set button.
- **Elapsed_Seconds**: The non-negative integer count of seconds that have passed since the stopwatch was last started or reset.
- **Todo_Module**: The JavaScript logic in `js/app.js` responsible for the To-Do list state and rendering.
- **Task_List**: The array of task objects persisted under the `dashboard_todos` localStorage key.
- **Normalized_Text**: A task's text after applying `trim()` and converting to lower-case.
- **Duplicate_Task**: A task whose Normalized_Text matches the Normalized_Text of any existing task in the Task_List.
- **Shake_Animation**: A brief CSS keyframe animation applied to the `#todo-input` element to signal a rejected duplicate submission.
- **Highlight_Animation**: A brief CSS class applied to an existing task's `<li>` element to draw attention to it when a duplicate submission is attempted.

---

## Requirements

### Requirement 1: Timer Mode Toggle

**User Story:** As a user, I want to switch the Focus Timer between a countdown and a stopwatch, so that I can use the same widget for both timed sessions and open-ended tracking.

#### Acceptance Criteria

1. THE Timer_Widget SHALL display a Mode_Toggle that allows the user to select either Countdown_Mode or Stopwatch_Mode.
2. WHEN the user activates the Mode_Toggle, THE Timer_Module SHALL switch the active mode and reset the timer display to its initial state for the newly selected mode.
3. WHILE Countdown_Mode is active, THE Timer_Widget SHALL display the Duration_Row.
4. WHILE Stopwatch_Mode is active, THE Timer_Widget SHALL hide the Duration_Row.
5. WHEN the user activates the Mode_Toggle, THE Timer_Module SHALL stop any running timer interval before switching modes.

---

### Requirement 2: Stopwatch Count-Up Behaviour

**User Story:** As a user, I want the stopwatch to count upward from zero, so that I can track how long I have been working on an open-ended task.

#### Acceptance Criteria

1. WHILE Stopwatch_Mode is active and the timer is running, THE Timer_Module SHALL increment Elapsed_Seconds by one every 1000 milliseconds.
2. WHILE Stopwatch_Mode is active, THE Timer_Module SHALL display Elapsed_Seconds in `MM:SS` format when Elapsed_Seconds is less than 3600, and in `HH:MM:SS` format when Elapsed_Seconds is 3600 or greater.
3. WHEN the Start button is activated in Stopwatch_Mode, THE Timer_Module SHALL begin incrementing Elapsed_Seconds from the current value.
4. WHEN the Stop button is activated in Stopwatch_Mode, THE Timer_Module SHALL pause incrementing Elapsed_Seconds without resetting the value.
5. WHEN the Reset button is activated in Stopwatch_Mode, THE Timer_Module SHALL stop any running interval and set Elapsed_Seconds to zero, updating the display to `00:00`.
6. IF the Start button is activated while the stopwatch is already running, THEN THE Timer_Module SHALL ignore the activation and continue the existing interval unchanged.

---

### Requirement 3: Countdown Mode Unchanged

**User Story:** As a user, I want the existing countdown timer to continue working exactly as before, so that my Pomodoro workflow is not disrupted.

#### Acceptance Criteria

1. WHILE Countdown_Mode is active, THE Timer_Module SHALL retain all existing countdown behaviour including start, stop, reset, duration setting, done alert, and audio notification.
2. WHILE Countdown_Mode is active, THE Timer_Widget SHALL display the Duration_Row with the stored duration value.
3. WHEN the Reset button is activated in Countdown_Mode, THE Timer_Module SHALL restore the display to the stored duration in `MM:SS` format.

---

### Requirement 4: Mode Persistence

**User Story:** As a user, I want my chosen timer mode to be remembered between sessions, so that I do not have to re-select it every time I open the dashboard.

#### Acceptance Criteria

1. WHEN the user activates the Mode_Toggle, THE Timer_Module SHALL write the selected mode identifier (`"countdown"` or `"stopwatch"`) to localStorage under the key `dashboard_timer_mode`.
2. WHEN the Dashboard initialises, THE Timer_Module SHALL read the `dashboard_timer_mode` key from localStorage and restore the Timer_Widget to the stored mode.
3. IF the `dashboard_timer_mode` key is absent from localStorage, THEN THE Timer_Module SHALL default to Countdown_Mode.

---

### Requirement 5: Duplicate Task Detection

**User Story:** As a user, I want the To-Do list to prevent me from adding a task I have already entered, so that my list stays clean without duplicates.

#### Acceptance Criteria

1. WHEN the user submits the To-Do form, THE Todo_Module SHALL compute the Normalized_Text of the submitted value.
2. WHEN the submitted Normalized_Text matches the Normalized_Text of any task in the Task_List, THE Todo_Module SHALL reject the submission and NOT add a new task to the Task_List.
3. THE Todo_Module SHALL treat text comparison as case-insensitive and SHALL trim leading and trailing whitespace before comparing.
4. IF the submitted Normalized_Text is empty after trimming, THEN THE Todo_Module SHALL reject the submission without triggering duplicate feedback (existing empty-input guard applies).

---

### Requirement 6: Duplicate Visual Feedback — Input Field

**User Story:** As a user, I want the input field to signal a duplicate attempt visually, so that I understand immediately why my task was not added.

#### Acceptance Criteria

1. WHEN a Duplicate_Task submission is rejected, THE Dashboard SHALL apply the Shake_Animation to the `#todo-input` element.
2. WHEN a Duplicate_Task submission is rejected, THE Dashboard SHALL apply a visual highlight style (border colour change) to the `#todo-input` element for a duration of 600 milliseconds.
3. WHEN the Shake_Animation completes, THE Dashboard SHALL remove the animation class from `#todo-input` so that subsequent duplicate attempts trigger the animation again.
4. THE Dashboard SHALL NOT call `window.alert()` or `window.confirm()` in response to a Duplicate_Task submission.

---

### Requirement 7: Duplicate Visual Feedback — Existing Task Highlight

**User Story:** As a user, I want the existing matching task to be briefly highlighted when I try to add a duplicate, so that I can quickly locate the task I already have.

#### Acceptance Criteria

1. WHEN a Duplicate_Task submission is rejected, THE Dashboard SHALL apply the Highlight_Animation to the `<li>` element of the first matching task in the rendered Task_List.
2. THE Highlight_Animation SHALL remain visible for a duration of 1200 milliseconds before being removed.
3. WHEN the Highlight_Animation completes, THE Dashboard SHALL remove the highlight class from the task element so that subsequent duplicate attempts trigger the animation again.
4. WHEN a Duplicate_Task submission is rejected, THE Dashboard SHALL scroll the matching task element into view if it is not currently visible within the `#todo-list` scroll container.
