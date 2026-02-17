/**
 * Contacts API Service
 *
 * Contact management and birthday tracking API client.
 *
 * @example
 * ```typescript
 * import { ContactsModule, ContactsApiService } from '@manacore/bot-services/contacts';
 *
 * // In module
 * @Module({
 *   imports: [ContactsModule.forRoot()]
 * })
 *
 * // In service
 * const birthdays = await contactsApiService.getBirthdaysToday(token);
 * ```
 */

export { ContactsModule } from './contacts.module.js';
export { ContactsApiService } from './contacts-api.service.js';
export {
	ContactsModuleOptions,
	Contact,
	ContactBirthday,
	CONTACTS_MODULE_OPTIONS,
	DEFAULT_CONTACTS_API_URL,
} from './types.js';
