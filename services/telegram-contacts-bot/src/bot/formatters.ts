import { format, differenceInYears, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Contact, ContactTag, ContactStats } from '../contacts/contacts.client';

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Get display name for contact
 */
function getDisplayName(contact: Contact): string {
	if (contact.displayName) return contact.displayName;
	if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
	if (contact.firstName) return contact.firstName;
	if (contact.lastName) return contact.lastName;
	if (contact.nickname) return contact.nickname;
	if (contact.email) return contact.email;
	return 'Unbekannt';
}

/**
 * Format a single contact for display
 */
export function formatContact(contact: Contact, detailed = false): string {
	const name = getDisplayName(contact);
	const star = contact.isFavorite ? ' ⭐' : '';

	let text = `👤 <b>${escapeHtml(name)}</b>${star}\n`;

	if (contact.company) {
		text += `🏢 ${escapeHtml(contact.company)}`;
		if (contact.jobTitle) {
			text += ` - ${escapeHtml(contact.jobTitle)}`;
		}
		text += '\n';
	}

	if (contact.phone) {
		text += `📞 ${escapeHtml(contact.phone)}\n`;
	}

	if (contact.mobile && contact.mobile !== contact.phone) {
		text += `📱 ${escapeHtml(contact.mobile)}\n`;
	}

	if (contact.email) {
		text += `📧 ${escapeHtml(contact.email)}\n`;
	}

	if (detailed) {
		if (contact.street || contact.city) {
			let address = '';
			if (contact.street) address += contact.street;
			if (contact.postalCode) address += `, ${contact.postalCode}`;
			if (contact.city) address += ` ${contact.city}`;
			if (contact.country) address += `, ${contact.country}`;
			text += `📍 ${escapeHtml(address.trim())}\n`;
		}

		if (contact.website) {
			text += `🌐 ${escapeHtml(contact.website)}\n`;
		}

		if (contact.birthday) {
			const birthday = parseISO(contact.birthday);
			const age = differenceInYears(new Date(), birthday);
			text += `🎂 ${format(birthday, 'd. MMMM yyyy', { locale: de })} (${age} Jahre)\n`;
		}

		if (contact.tags && contact.tags.length > 0) {
			const tagNames = contact.tags.map((t) => `#${t.name}`).join(' ');
			text += `🏷️ ${escapeHtml(tagNames)}\n`;
		}

		if (contact.notes) {
			const notes =
				contact.notes.length > 100 ? contact.notes.substring(0, 100) + '...' : contact.notes;
			text += `📝 ${escapeHtml(notes)}\n`;
		}
	}

	return text.trim();
}

/**
 * Format contact list
 */
export function formatContactList(contacts: Contact[], title: string): string {
	if (contacts.length === 0) {
		return `${title}\n\n✨ Keine Kontakte gefunden.`;
	}

	let text = `${title}\n\n`;

	for (const contact of contacts.slice(0, 15)) {
		const name = getDisplayName(contact);
		const star = contact.isFavorite ? '⭐ ' : '';
		const company = contact.company ? ` (${contact.company})` : '';
		text += `${star}👤 ${escapeHtml(name)}${escapeHtml(company)}\n`;
	}

	if (contacts.length > 15) {
		text += `\n... und ${contacts.length - 15} weitere`;
	}

	text += `\n\n───────────────\n${contacts.length} Kontakt${contacts.length === 1 ? '' : 'e'}`;

	return text;
}

/**
 * Format search results
 */
export function formatSearchResults(contacts: Contact[], query: string): string {
	const title = `🔍 <b>Suche nach "${escapeHtml(query)}"</b>`;

	if (contacts.length === 0) {
		return `${title}\n\n❌ Keine Kontakte gefunden.\n\nTipp: Versuche es mit einem anderen Suchbegriff.`;
	}

	let text = `${title}\n\n`;

	for (const contact of contacts.slice(0, 10)) {
		text += formatContact(contact, false) + '\n\n';
	}

	if (contacts.length > 10) {
		text += `... und ${contacts.length - 10} weitere Treffer`;
	}

	return text;
}

/**
 * Format favorites list
 */
export function formatFavorites(contacts: Contact[]): string {
	return formatContactList(contacts, '⭐ <b>Deine Favoriten</b>');
}

/**
 * Format recent contacts
 */
export function formatRecentContacts(contacts: Contact[]): string {
	return formatContactList(contacts, '🕐 <b>Zuletzt hinzugefügt</b>');
}

/**
 * Format birthday contact
 */
function formatBirthdayContact(contact: Contact): string {
	const name = getDisplayName(contact);
	const birthday = parseISO(contact.birthday!);
	const today = new Date();

	// Calculate days until birthday
	const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
	if (thisYearBirthday < today) {
		thisYearBirthday.setFullYear(today.getFullYear() + 1);
	}
	const daysUntil = Math.ceil(
		(thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);

	const age = differenceInYears(thisYearBirthday, birthday);

	let dayText = '';
	if (daysUntil === 0) {
		dayText = '🎉 <b>Heute!</b>';
	} else if (daysUntil === 1) {
		dayText = '⏰ Morgen';
	} else {
		dayText = `in ${daysUntil} Tagen`;
	}

	return `🎂 <b>${escapeHtml(name)}</b> wird ${age}\n   ${format(birthday, 'd. MMMM', { locale: de })} (${dayText})`;
}

/**
 * Format upcoming birthdays
 */
export function formatUpcomingBirthdays(contacts: Contact[], daysAhead: number): string {
	const title = `🎂 <b>Anstehende Geburtstage</b> (nächste ${daysAhead} Tage)`;

	if (contacts.length === 0) {
		return `${title}\n\n✨ Keine Geburtstage in den nächsten ${daysAhead} Tagen.`;
	}

	let text = `${title}\n\n`;

	for (const contact of contacts) {
		text += formatBirthdayContact(contact) + '\n\n';
	}

	return text.trim();
}

/**
 * Format birthday reminder notification
 */
export function formatBirthdayReminder(contact: Contact): string {
	const name = getDisplayName(contact);
	const birthday = parseISO(contact.birthday!);
	const today = new Date();

	const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
	if (thisYearBirthday < today) {
		thisYearBirthday.setFullYear(today.getFullYear() + 1);
	}
	const daysUntil = Math.ceil(
		(thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
	);
	const age = differenceInYears(thisYearBirthday, birthday);

	if (daysUntil === 0) {
		return `🎉 <b>Heute hat ${escapeHtml(name)} Geburtstag!</b>\n\nWird ${age} Jahre alt. Zeit zum Gratulieren! 🎈`;
	}

	return `🎂 <b>Geburtstags-Erinnerung</b>\n\n${escapeHtml(name)} hat in ${daysUntil} Tag${daysUntil === 1 ? '' : 'en'} Geburtstag!\n📅 ${format(birthday, 'd. MMMM', { locale: de })} (wird ${age})`;
}

/**
 * Format tags list
 */
export function formatTags(tags: ContactTag[]): string {
	if (tags.length === 0) {
		return '🏷️ <b>Deine Tags</b>\n\nKeine Tags vorhanden.';
	}

	let text = '🏷️ <b>Deine Tags</b>\n\n';

	for (const tag of tags) {
		text += `• #${escapeHtml(tag.name)}\n`;
	}

	text += `\n───────────────\n${tags.length} Tag${tags.length === 1 ? '' : 's'}`;
	text += '\n\nNutze /tag [name] um Kontakte mit einem Tag anzuzeigen.';

	return text;
}

/**
 * Format contacts by tag
 */
export function formatContactsByTag(contacts: Contact[], tagName: string): string {
	return formatContactList(contacts, `🏷️ <b>Kontakte mit Tag #${escapeHtml(tagName)}</b>`);
}

/**
 * Format contact statistics
 */
export function formatStats(stats: ContactStats): string {
	return `📊 <b>Deine Kontakt-Statistiken</b>

👥 Gesamt: ${stats.totalContacts} Kontakte
⭐ Favoriten: ${stats.favorites}
🎂 Mit Geburtstag: ${stats.withBirthday}
🆕 Diese Woche hinzugefügt: ${stats.recentlyAdded}
🏷️ Tags: ${stats.tagCount}`;
}

/**
 * Format contact created confirmation
 */
export function formatContactCreated(contact: Contact): string {
	return `✅ <b>Kontakt erstellt!</b>\n\n${formatContact(contact, true)}`;
}

/**
 * Format note added confirmation
 */
export function formatNoteAdded(contactName: string): string {
	return `📝 Notiz zu <b>${escapeHtml(contactName)}</b> hinzugefügt!`;
}

/**
 * Format activity logged confirmation
 */
export function formatActivityLogged(contactName: string, activityType: string): string {
	const activityEmoji: Record<string, string> = {
		called: '📞',
		emailed: '📧',
		met: '🤝',
		messaged: '💬',
	};

	const emoji = activityEmoji[activityType] || '📋';
	return `${emoji} Aktivität für <b>${escapeHtml(contactName)}</b> geloggt!`;
}

/**
 * Format help message
 */
export function formatHelpMessage(): string {
	return `📇 <b>Contacts Bot - Hilfe</b>

<b>Kontakte finden:</b>
/search [Name] - Kontakt suchen
/favorites - Favoriten anzeigen
/recent - Zuletzt hinzugefügt

<b>Geburtstage:</b>
/birthdays - Anstehende Geburtstage

<b>Tags:</b>
/tags - Alle Tags anzeigen
/tag [Name] - Kontakte mit Tag

<b>Statistiken:</b>
/stats - Kontakt-Statistiken

<b>Neuer Kontakt:</b>
/add Vorname Nachname

<b>Account:</b>
/link - ManaCore Account verknüpfen
/unlink - Verknüpfung trennen
/status - Verbindungsstatus

───────────────
💡 Du kannst auch einfach einen Namen senden, um danach zu suchen!`;
}

/**
 * Format status message
 */
export function formatStatusMessage(
	isLinked: boolean,
	username?: string | null,
	lastActive?: Date
): string {
	if (!isLinked) {
		return `📊 <b>Status</b>

❌ Nicht mit ManaCore verknüpft

Nutze /link um deinen Account zu verknüpfen.`;
	}

	const lastActiveText = lastActive ? format(lastActive, 'd. MMM HH:mm', { locale: de }) : 'Nie';

	return `📊 <b>Status</b>

✅ Verknüpft mit ManaCore
👤 ${username || 'Unbekannt'}
🕐 Letzte Aktivität: ${lastActiveText}

Nutze /unlink um die Verknüpfung zu trennen.`;
}
