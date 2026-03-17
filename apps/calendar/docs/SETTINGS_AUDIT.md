# Calendar Settings Audit & Simplification Proposal

## Current State: 41 Settings

The calendar app has 41 settings defined in `CalendarAppSettings`. Only **13** are exposed in the Settings UI. The remaining 28 are either used internally with hardcoded defaults or are dead code.

---

## All Settings by Category

### A. View Settings (9) — Core, keep all

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 1 | `defaultView` | `'week' \| 'month' \| 'agenda'` | `'week'` | Yes | ViewsBar, SettingsModal |
| 2 | `weekStartsOn` | `0 \| 1` | `1` (Mon) | No | WeekView, MonthView, DateStrip, viewStore |
| 3 | `showOnlyWeekdays` | `boolean` | `false` | Yes | WeekView, MonthView |
| 4 | `showWeekNumbers` | `boolean` | `false` | Yes | WeekView |
| 5 | `timeFormat` | `'24h' \| '12h'` | `'24h'` | Yes | WeekView, formatTime/formatHour |
| 6 | `filterHoursEnabled` | `boolean` | `false` | Yes | WeekView, useVisibleHours |
| 7 | `dayStartHour` | `number` | `6` | Yes | WeekView, useVisibleHours |
| 8 | `dayEndHour` | `number` | `20` | Yes | WeekView, useVisibleHours |
| 9 | `allDayDisplayMode` | `'header' \| 'block'` | `'header'` | Yes | WeekView |

### B. Header Settings (4) — Not in UI, used by CalendarHeader

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 10 | `headerCompact` | `boolean` | `false` | No | CalendarHeader |
| 11 | `headerWeekdayFormat` | `'full' \| 'short' \| 'hidden'` | `'full'` | No | CalendarHeader |
| 12 | `headerShowDate` | `boolean` | `true` | No | CalendarHeader |
| 13 | `headerAlwaysShowMonth` | `boolean` | `false` | No | CalendarHeader |

### C. DateStrip Settings (8) — Not in UI, used by DateStrip

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 14 | `dateStripShowMoonPhases` | `boolean` | `true` | No | DateStrip |
| 15 | `dateStripShowEventIndicators` | `boolean` | `true` | No | DateStrip |
| 16 | `dateStripShowWeekday` | `boolean` | `true` | No | DateStrip |
| 17 | `dateStripHighlightWeekends` | `boolean` | `true` | No | DateStrip |
| 18 | `dateStripShowMonthDividers` | `boolean` | `true` | No | DateStrip |
| 19 | `dateStripCompact` | `boolean` | `false` | No | DateStrip |
| 20 | `dateStripShowWeekNumbers` | `boolean` | `false` | No | DateStrip |
| 21 | `dateStripCollapsed` | `boolean` | `false` | No | DateStripFab, Layout |

### D. Tag/Filter Settings (2) — Runtime state, not user preference

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 22 | `tagStripCollapsed` | `boolean` | `true` | No | Layout |
| 23 | `selectedTagIds` | `string[]` | `[]` | No | MonthView, TagStrip, Layout |

### E. Mode Toggles (3) — Runtime state, not user preference

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 24 | `immersiveModeEnabled` | `boolean` | `false` | No | Layout |
| 25 | `showTasksInCalendar` | `boolean` | `false` | No | WeekView, Layout (reset on load) |
| 26 | `sidebarCollapsed` | `boolean` | `true` | No | Layout (reset on load) |

### F. Birthday Settings (2) — In UI

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 27 | `showBirthdays` | `boolean` | `true` | Yes | WeekView, MonthView, Layout |
| 28 | `showBirthdayAge` | `boolean` | `true` | Yes | WeekView, BirthdayPopover |

### G. Quick View Pill (2) — Not in UI

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 29 | `quickViewPillViews` | `CalendarViewType[]` | `['week','month','agenda']` | No | ViewModePill |
| 30 | `customDayCount` | `number` | `30` | No | viewStore (agenda range) |

### H. Event Defaults (2) — In UI

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 31 | `defaultEventDuration` | `number` | `60` | Yes | EventForm |
| 32 | `defaultReminder` | `number` | `15` | Yes | SettingsModal |

### I. Voice Input (1) — In UI

| # | Setting | Type | Default | In UI | Used By |
|---|---------|------|---------|-------|---------|
| 33 | `sttLanguage` | `'de' \| 'auto'` | `'de'` | Yes | voice-recording composable |

---

## Simplification Proposal: 41 → 18 Settings

### Principle: Settings should be **user-visible preferences** that persist. Runtime UI state (sidebar open, tag selection) and hardcoded component behavior belong elsewhere.

### Keep as Settings (18)

These are genuine user preferences that should persist across sessions:

| # | Setting | Rationale |
|---|---------|-----------|
| 1 | `defaultView` | User choice |
| 2 | `weekStartsOn` | Regional preference, add to UI |
| 3 | `showOnlyWeekdays` | User choice |
| 4 | `showWeekNumbers` | User choice |
| 5 | `timeFormat` | Regional preference |
| 6 | `filterHoursEnabled` | User choice |
| 7 | `dayStartHour` | User choice |
| 8 | `dayEndHour` | User choice |
| 9 | `allDayDisplayMode` | User choice |
| 10 | `showBirthdays` | User choice |
| 11 | `showBirthdayAge` | User choice |
| 12 | `defaultEventDuration` | User choice |
| 13 | `defaultReminder` | User choice |
| 14 | `sttLanguage` | User choice |
| 15 | `dateStripShowMoonPhases` | Unique feature, worth keeping as user choice |
| 16 | `dateStripShowEventIndicators` | Useful toggle |
| 17 | `dateStripHighlightWeekends` | Useful toggle |
| 18 | `dateStripCompact` | Layout preference |

### Remove — Convert to Hardcoded Defaults (12)

These are not exposed in any UI and their defaults are always used:

| Setting | Default | Reason to Remove |
|---------|---------|------------------|
| `headerCompact` | `false` | Never toggled, no UI |
| `headerWeekdayFormat` | `'full'` | Never toggled, no UI |
| `headerShowDate` | `true` | Never toggled, no UI |
| `headerAlwaysShowMonth` | `false` | Never toggled, no UI |
| `dateStripShowWeekday` | `true` | Always true, no reason to hide |
| `dateStripShowMonthDividers` | `true` | Always true, no reason to hide |
| `dateStripShowWeekNumbers` | `false` | Duplicate of `showWeekNumbers` |
| `quickViewPillViews` | `['week','month','agenda']` | Only 3 views exist, always all shown |
| `customDayCount` | `30` | Hardcode in agenda view |

### Remove — Move to Component-Local State (11)

These are runtime UI state, not persistent preferences. They should be `$state()` variables in the components that use them:

| Setting | Current Behavior | Where to Move |
|---------|-----------------|---------------|
| `dateStripCollapsed` | Persisted | `$state(false)` in DateStrip/Layout |
| `tagStripCollapsed` | Persisted | `$state(true)` in Layout |
| `selectedTagIds` | Persisted | `$state([])` in Layout or a tagFilterStore |
| `immersiveModeEnabled` | Persisted | `$state(false)` in Layout |
| `showTasksInCalendar` | Reset to `false` on load | `$state(false)` in Layout |
| `sidebarCollapsed` | Reset to `true` on load | `$state(true)` in Layout |

**Note:** `selectedTagIds` could arguably persist, but the current behavior (persisting filter state) can confuse users who forget they have filters active. Resetting on load is safer.

---

## Proposed New Interface

```typescript
export interface CalendarAppSettings extends Record<string, unknown> {
  // View
  defaultView: CalendarViewType;
  weekStartsOn: 0 | 1;
  showOnlyWeekdays: boolean;
  showWeekNumbers: boolean;
  timeFormat: '24h' | '12h';
  filterHoursEnabled: boolean;
  dayStartHour: number;
  dayEndHour: number;
  allDayDisplayMode: 'header' | 'block';

  // Display
  showBirthdays: boolean;
  showBirthdayAge: boolean;
  dateStripShowMoonPhases: boolean;
  dateStripShowEventIndicators: boolean;
  dateStripHighlightWeekends: boolean;
  dateStripCompact: boolean;

  // Event defaults
  defaultEventDuration: number;
  defaultReminder: number;

  // Voice
  sttLanguage: 'de' | 'auto';
}
```

### New Settings UI Sections

| Section | Settings | Currently in UI |
|---------|----------|-----------------|
| **Ansicht** | defaultView, weekStartsOn, timeFormat, showOnlyWeekdays, showWeekNumbers | Mostly yes, add weekStartsOn |
| **Stunden** | filterHoursEnabled, dayStartHour, dayEndHour | Yes |
| **Anzeige** | allDayDisplayMode, dateStripCompact, dateStripShowMoonPhases, dateStripShowEventIndicators, dateStripHighlightWeekends | Partially |
| **Termine** | defaultEventDuration, defaultReminder | Yes |
| **Geburtstage** | showBirthdays, showBirthdayAge | Yes |
| **Spracheingabe** | sttLanguage | Yes |

---

## Migration Steps

1. Move UI state to component-local `$state()` (sidebarCollapsed, tagStripCollapsed, etc.)
2. Replace header settings with hardcoded values in CalendarHeader
3. Replace removed dateStrip settings with hardcoded values in DateStrip
4. Remove `quickViewPillViews` and `customDayCount` (hardcode)
5. Update `CalendarAppSettings` interface
6. Update settings store (remove getters, toggles, cloud sync exclusions)
7. Update SettingsModal to expose `weekStartsOn` and dateStrip display settings
8. Add localStorage migration to handle existing users (read old keys, map to new)

---

## Impact Assessment

| Change | Risk | Files Affected |
|--------|------|----------------|
| Remove header settings | Low — defaults always used | CalendarHeader.svelte, settings store |
| Move UI state out | Medium — need to wire up component state | Layout, DateStripFab, TagStrip |
| Remove quickViewPillViews | Low — only 3 views exist | ViewModePill.svelte |
| Add weekStartsOn to UI | Low — just add dropdown | SettingsModal, settings page |
| localStorage migration | Low — one-time migration function | settings store |
