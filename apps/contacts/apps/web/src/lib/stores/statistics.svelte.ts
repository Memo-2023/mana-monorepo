/**
 * Contacts Statistics Store - Calculates contact statistics using Svelte 5 runes
 */

import type { Contact } from '$lib/api/contacts';
import { subDays, format, parseISO, isWithinInterval, getMonth, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import type {
	HeatmapDataPoint,
	TrendDataPoint,
	DonutSegment,
	ProgressItem,
} from '@manacore/shared-ui';

// Types
export interface ContactTag {
	id: string;
	name: string;
	color: string;
}

// State
let contacts = $state<Contact[]>([]);
let tags = $state<ContactTag[]>([]);

export const contactsStatisticsStore = {
	// Setters
	setContacts(newContacts: Contact[]) {
		contacts = newContacts;
	},

	setTags(newTags: ContactTag[]) {
		tags = newTags;
	},

	// Quick Stats
	get totalContacts() {
		return contacts.length;
	},

	get favoriteContacts() {
		return contacts.filter((c) => c.isFavorite).length;
	},

	get archivedContacts() {
		return contacts.filter((c) => c.isArchived).length;
	},

	get activeContacts() {
		return contacts.filter((c) => !c.isArchived).length;
	},

	get recentlyAdded() {
		const weekAgo = subDays(new Date(), 7);
		return contacts.filter((c) => {
			const createdAt =
				typeof c.createdAt === 'string' ? parseISO(c.createdAt) : new Date(c.createdAt);
			return createdAt >= weekAgo;
		}).length;
	},

	get birthdaysThisMonth() {
		const currentMonth = getMonth(new Date());
		return contacts.filter((c) => {
			if (!c.birthday) return false;
			const birthday = typeof c.birthday === 'string' ? parseISO(c.birthday) : new Date(c.birthday);
			return getMonth(birthday) === currentMonth;
		}).length;
	},

	get contactsWithEmail() {
		return contacts.filter((c) => c.email).length;
	},

	get contactsWithPhone() {
		return contacts.filter((c) => c.phone || c.mobile).length;
	},

	// Completeness rate (contacts with email AND phone)
	get completenessRate() {
		if (contacts.length === 0) return 0;
		const complete = contacts.filter((c) => c.email && (c.phone || c.mobile)).length;
		return Math.round((complete / contacts.length) * 100);
	},

	// Activity Heatmap (last 6 months) - based on contact creation
	get activityHeatmap(): HeatmapDataPoint[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 180);

		// Count contacts created per day
		const creationMap = new Map<string, number>();

		contacts.forEach((c) => {
			const createdAt =
				typeof c.createdAt === 'string' ? parseISO(c.createdAt) : new Date(c.createdAt);
			if (createdAt >= startDate && createdAt <= endDate) {
				const dateKey = format(createdAt, 'yyyy-MM-dd');
				creationMap.set(dateKey, (creationMap.get(dateKey) || 0) + 1);
			}
		});

		// Generate all days
		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: creationMap.get(dateKey) || 0,
				dayOfWeek: day.getDay(),
			};
		});
	},

	// Weekly Trend (last 4 weeks)
	get weeklyTrend(): TrendDataPoint[] {
		const endDate = new Date();
		const startDate = subDays(endDate, 27);

		const creationMap = new Map<string, number>();

		contacts.forEach((c) => {
			const createdAt =
				typeof c.createdAt === 'string' ? parseISO(c.createdAt) : new Date(c.createdAt);
			if (createdAt >= startDate && createdAt <= endDate) {
				const dateKey = format(createdAt, 'yyyy-MM-dd');
				creationMap.set(dateKey, (creationMap.get(dateKey) || 0) + 1);
			}
		});

		const days = eachDayOfInterval({ start: startDate, end: endDate });

		return days.map((day) => {
			const dateKey = format(day, 'yyyy-MM-dd');
			return {
				date: dateKey,
				count: creationMap.get(dateKey) || 0,
				label: format(day, 'EEE', { locale: de }),
			};
		});
	},

	// Contact Status Breakdown (Donut Chart) - Favorites / Active / Archived
	get statusBreakdown(): DonutSegment[] {
		const total = contacts.length;
		if (total === 0) return [];

		const favorites = contacts.filter((c) => c.isFavorite && !c.isArchived).length;
		const archived = contacts.filter((c) => c.isArchived).length;
		const regular = contacts.filter((c) => !c.isFavorite && !c.isArchived).length;

		return [
			{
				id: 'favorites',
				label: 'Favoriten',
				count: favorites,
				percentage: Math.round((favorites / total) * 100),
				color: '#F59E0B', // amber
			},
			{
				id: 'regular',
				label: 'Aktiv',
				count: regular,
				percentage: Math.round((regular / total) * 100),
				color: '#10B981', // green
			},
			{
				id: 'archived',
				label: 'Archiviert',
				count: archived,
				percentage: Math.round((archived / total) * 100),
				color: '#6B7280', // gray
			},
		];
	},

	// Tags Progress (Progress Bars)
	get tagProgress(): ProgressItem[] {
		// Count contacts per tag
		const tagCountMap = new Map<string, number>();

		// This requires contacts to have a tags array - we'll estimate from the tag data
		// For now, we'll show tags with placeholder counts
		// In a real implementation, we'd need contactTags relation data

		const result: ProgressItem[] = tags.map((tag) => ({
			id: tag.id,
			name: tag.name,
			color: tag.color || '#6B7280',
			total: contacts.length, // Total contacts as reference
			completed: 0, // Would need contact-tag relation to calculate
			percentage: 0,
		}));

		return result.sort((a, b) => b.completed - a.completed);
	},

	// Info completeness breakdown
	get infoBreakdown(): DonutSegment[] {
		const total = contacts.length;
		if (total === 0) return [];

		const withEmail = contacts.filter((c) => c.email).length;
		const withPhone = contacts.filter((c) => c.phone || c.mobile).length;
		const withCompany = contacts.filter((c) => c.company).length;
		const withBirthday = contacts.filter((c) => c.birthday).length;

		return [
			{
				id: 'email',
				label: 'Mit E-Mail',
				count: withEmail,
				percentage: Math.round((withEmail / total) * 100),
				color: '#3B82F6', // blue
			},
			{
				id: 'phone',
				label: 'Mit Telefon',
				count: withPhone,
				percentage: Math.round((withPhone / total) * 100),
				color: '#10B981', // green
			},
			{
				id: 'company',
				label: 'Mit Firma',
				count: withCompany,
				percentage: Math.round((withCompany / total) * 100),
				color: '#8B5CF6', // violet
			},
			{
				id: 'birthday',
				label: 'Mit Geburtstag',
				count: withBirthday,
				percentage: Math.round((withBirthday / total) * 100),
				color: '#EC4899', // pink
			},
		];
	},

	// Country breakdown
	get countryBreakdown(): ProgressItem[] {
		const countryMap = new Map<string, number>();

		contacts.forEach((c) => {
			const country = c.country || 'Unbekannt';
			countryMap.set(country, (countryMap.get(country) || 0) + 1);
		});

		const result: ProgressItem[] = [];
		const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
		let colorIndex = 0;

		countryMap.forEach((count, country) => {
			if (country !== 'Unbekannt' || count > 0) {
				result.push({
					id: country,
					name: country,
					color: colors[colorIndex % colors.length],
					total: contacts.length,
					completed: count,
					percentage: Math.round((count / contacts.length) * 100),
				});
				colorIndex++;
			}
		});

		return result.sort((a, b) => b.completed - a.completed).slice(0, 8);
	},

	// Total tags count
	get totalTags() {
		return tags.length;
	},
};
