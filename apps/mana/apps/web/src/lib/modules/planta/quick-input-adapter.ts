/**
 * Planta QuickInputBar Adapter
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import type { QuickInputItem } from '@mana/shared-ui';
import { db } from '$lib/data/database';
import { parsePlantInput, formatParsedPlantPreview } from './utils/plant-parser';
import { plantTable } from './collections';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neue Pflanze oder suchen...',
		appIcon: 'plant',
		deferSearch: true,
		createText: 'Hinzufügen',
		emptyText: 'Keine Pflanzen gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			const plants = await db.table('plants').toArray();
			return (plants as Record<string, unknown>[])
				.filter(
					(p) =>
						!(p.deletedAt as string) &&
						((p.name as string)?.toLowerCase().includes(q) ||
							(p.species as string)?.toLowerCase().includes(q))
				)
				.slice(0, 10)
				.map((p) => ({
					id: p.id as string,
					title: (p.name as string) || '',
					subtitle: (p.species as string) || (p.location as string) || '',
				}));
		},

		onSelect() {},

		onParseCreate(query) {
			if (!query.trim()) return null;
			const parsed = parsePlantInput(query);
			const preview = formatParsedPlantPreview(parsed);
			return {
				title: `"${parsed.name}" hinzufügen`,
				subtitle: preview || 'Neue Pflanze',
			};
		},

		async onCreate(query) {
			if (!query.trim()) return;
			const parsed = parsePlantInput(query);
			await plantTable.add({
				id: crypto.randomUUID(),
				name: parsed.name,
				species: parsed.species,
			});
		},
	};
}
