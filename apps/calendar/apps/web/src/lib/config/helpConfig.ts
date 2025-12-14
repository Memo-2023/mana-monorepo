import { NavigationArrow, CalendarBlank, ListChecks } from '@manacore/shared-icons';
import {
	COMMON_SHORTCUTS,
	COMMON_SYNTAX,
	DEFAULT_LIVE_EXAMPLE,
	type HelpModalConfig,
	type ShortcutCategory,
	type SyntaxGroup,
} from '@manacore/shared-ui';

/**
 * Calendar-specific keyboard shortcuts
 */
const CALENDAR_SHORTCUTS: ShortcutCategory[] = [
	{
		id: 'navigation',
		title: 'Navigation',
		icon: NavigationArrow,
		shortcuts: [
			{
				keys: ['Cmd', '1'],
				altKeys: ['Ctrl', '1'],
				description: 'Kalender öffnen',
				category: 'navigation',
			},
			{
				keys: ['Cmd', '2'],
				altKeys: ['Ctrl', '2'],
				description: 'Aufgaben öffnen',
				category: 'navigation',
			},
			{
				keys: ['Cmd', '3'],
				altKeys: ['Ctrl', '3'],
				description: 'Statistiken öffnen',
				category: 'navigation',
			},
			{
				keys: ['Cmd', '4'],
				altKeys: ['Ctrl', '4'],
				description: 'Einstellungen öffnen',
				category: 'navigation',
			},
		],
	},
	{
		id: 'calendar',
		title: 'Kalender',
		icon: CalendarBlank,
		shortcuts: [
			{
				keys: ['Enter'],
				description: 'Event/Task öffnen',
				category: 'calendar',
			},
			{
				keys: ['Space'],
				description: 'Event/Task öffnen',
				category: 'calendar',
			},
			{
				keys: ['Esc'],
				description: 'Drag/Resize abbrechen',
				category: 'calendar',
			},
		],
	},
	{
		id: 'tasks',
		title: 'Aufgaben',
		icon: ListChecks,
		shortcuts: [
			{
				keys: ['Enter'],
				description: 'Aufgabe öffnen',
				category: 'tasks',
			},
			{
				keys: ['Space'],
				description: 'Aufgabe abhaken',
				category: 'tasks',
			},
		],
	},
];

/**
 * Calendar-specific syntax patterns (extends common syntax)
 */
const CALENDAR_SYNTAX: SyntaxGroup[] = [
	// Calendar uses all common syntax patterns
];

/**
 * Complete help configuration for the Calendar app
 * Combines common shortcuts/syntax with Calendar-specific ones
 */
export const CALENDAR_HELP_CONFIG: HelpModalConfig = {
	shortcuts: [...COMMON_SHORTCUTS, ...CALENDAR_SHORTCUTS],
	syntax: [...COMMON_SYNTAX, ...CALENDAR_SYNTAX],
	defaultTab: 'shortcuts',
	liveExample: DEFAULT_LIVE_EXAMPLE,
};

/**
 * Export individual parts for customization
 */
export { CALENDAR_SHORTCUTS, CALENDAR_SYNTAX };
