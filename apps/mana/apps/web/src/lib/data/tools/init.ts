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
import { habitsTools } from '$lib/modules/habits/tools';
import { journalTools } from '$lib/modules/journal/tools';
import { notesTools } from '$lib/modules/notes/tools';
import { contactsTools } from '$lib/modules/contacts/tools';
import { bodyTools } from '$lib/modules/body/tools';
import { financeTools } from '$lib/modules/finance/tools';
import { dreamsTools } from '$lib/modules/dreams/tools';
import { cardsTools } from '$lib/modules/cards/tools';
import { timesTools } from '$lib/modules/times/tools';
import { socialEventsTools } from '$lib/modules/events/tools';

let initialized = false;

export function initTools(): void {
	if (initialized) return;
	registerTools(todoTools);
	registerTools(calendarTools);
	registerTools(drinkTools);
	registerTools(nutriphiTools);
	registerTools(placesTools);
	registerTools(habitsTools);
	registerTools(journalTools);
	registerTools(notesTools);
	registerTools(contactsTools);
	registerTools(bodyTools);
	registerTools(financeTools);
	registerTools(dreamsTools);
	registerTools(cardsTools);
	registerTools(timesTools);
	registerTools(socialEventsTools);
	initialized = true;
}
