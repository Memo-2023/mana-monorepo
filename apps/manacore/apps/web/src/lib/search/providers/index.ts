import type { SearchRegistry } from '../registry';
import { todoSearchProvider } from './todo';
import { calendarSearchProvider } from './calendar';
import { contactsSearchProvider } from './contacts';
import { chatSearchProvider } from './chat';
import { storageSearchProvider } from './storage';
import { cardsSearchProvider } from './cards';

export function registerAllProviders(registry: SearchRegistry): void {
	registry.register(todoSearchProvider);
	registry.register(calendarSearchProvider);
	registry.register(contactsSearchProvider);
	registry.register(chatSearchProvider);
	registry.register(storageSearchProvider);
	registry.register(cardsSearchProvider);
}

export {
	todoSearchProvider,
	calendarSearchProvider,
	contactsSearchProvider,
	chatSearchProvider,
	storageSearchProvider,
	cardsSearchProvider,
};
