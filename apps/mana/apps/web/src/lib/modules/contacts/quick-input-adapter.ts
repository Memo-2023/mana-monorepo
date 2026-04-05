/**
 * Contacts QuickInputBar Adapter
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@mana/shared-ui';
import { db } from '$lib/data/database';
import { parseContactInput, formatParsedContactPreview } from './utils/contact-parser';
import type { LocalContact } from './types';
import { contactModalStore } from './stores/modal.svelte';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neuer Kontakt oder suchen...',
		appIcon: 'contacts',
		deferSearch: true,
		createText: 'Erstellen',
		emptyText: 'Keine Kontakte gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			const contacts = await db.table<LocalContact>('contacts').toArray();
			return contacts
				.filter(
					(c) =>
						!c.deletedAt &&
						!c.isArchived &&
						(c.firstName?.toLowerCase().includes(q) ||
							c.lastName?.toLowerCase().includes(q) ||
							c.email?.toLowerCase().includes(q) ||
							c.company?.toLowerCase().includes(q))
				)
				.slice(0, 10)
				.map((c) => ({
					id: c.id,
					title: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '',
					subtitle: c.company || c.email || '',
				}));
		},

		onSelect(item: QuickInputItem) {
			// Navigate to contact or open detail
			window.location.hash = `contact=${item.id}`;
		},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const parsed = parseContactInput(query);
			const preview = formatParsedContactPreview(parsed);
			return {
				title: parsed.displayName ? `"${parsed.displayName}" erstellen` : 'Kontakt erstellen',
				subtitle: preview || 'Neuer Kontakt',
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const parsed = parseContactInput(query);
			// Open the contact modal with prefilled data
			contactModalStore.open({
				firstName: parsed.firstName,
				lastName: parsed.lastName,
				email: parsed.email,
				phone: parsed.phone,
				company: parsed.company,
			});
		},
	};
}
