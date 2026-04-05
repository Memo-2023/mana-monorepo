import type { SearchRegistry } from '../registry';
import { todoSearchProvider } from './todo';
import { calendarSearchProvider } from './calendar';
import { contactsSearchProvider } from './contacts';
import { chatSearchProvider } from './chat';
import { storageSearchProvider } from './storage';
import { cardsSearchProvider } from './cards';
import { pictureSearchProvider } from './picture';
import { presiSearchProvider } from './presi';
import { musicSearchProvider } from './music';
import { zitareSearchProvider } from './zitare';
import { clockSearchProvider } from './clock';

export function registerAllProviders(registry: SearchRegistry): void {
	registry.register(todoSearchProvider);
	registry.register(calendarSearchProvider);
	registry.register(contactsSearchProvider);
	registry.register(chatSearchProvider);
	registry.register(storageSearchProvider);
	registry.register(cardsSearchProvider);
	registry.register(pictureSearchProvider);
	registry.register(presiSearchProvider);
	registry.register(musicSearchProvider);
	registry.register(zitareSearchProvider);
	registry.register(clockSearchProvider);
}

export {
	todoSearchProvider,
	calendarSearchProvider,
	contactsSearchProvider,
	chatSearchProvider,
	storageSearchProvider,
	cardsSearchProvider,
	pictureSearchProvider,
	presiSearchProvider,
	musicSearchProvider,
	zitareSearchProvider,
	clockSearchProvider,
};
