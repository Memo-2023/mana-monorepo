/**
 * Tool initialization — Registers all module tools.
 * Call once at app startup.
 */

import { registerTools } from './registry';
import { todoTools } from '$lib/modules/todo/tools';
import { calendarTools } from '$lib/modules/calendar/tools';
import { drinkTools } from '$lib/modules/drink/tools';
import { nutriphiTools } from '$lib/modules/nutriphi/tools';
import { placesTools } from '$lib/modules/places/tools';

let initialized = false;

export function initTools(): void {
	if (initialized) return;
	registerTools(todoTools);
	registerTools(calendarTools);
	registerTools(drinkTools);
	registerTools(nutriphiTools);
	registerTools(placesTools);
	initialized = true;
}
