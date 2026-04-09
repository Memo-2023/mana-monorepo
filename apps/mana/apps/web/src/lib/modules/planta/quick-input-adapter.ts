/**
 * Planta QuickInputBar Adapter
 */

import type { InputBarAdapter } from '$lib/quick-input/types';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import { parsePlantInput, formatParsedPlantPreview } from './utils/plant-parser';
import { plantMutations } from './mutations';
import type { LocalPlant } from './types';

export function createAdapter(): InputBarAdapter {
	return {
		placeholder: 'Neue Pflanze oder suchen...',
		appIcon: 'plant',
		deferSearch: true,
		createText: 'Hinzufügen',
		emptyText: 'Keine Pflanzen gefunden',

		async onSearch(query) {
			const q = query.toLowerCase();
			// `name` is encrypted on disk — decrypt before substring matching.
			const raw = await db.table<LocalPlant>('plants').toArray();
			const visible = raw.filter((p) => !p.deletedAt);
			const decrypted = await decryptRecords<LocalPlant>('plants', visible);
			return decrypted
				.filter((p) => {
					const name = p.name?.toLowerCase() ?? '';
					const sci = p.scientificName?.toLowerCase() ?? '';
					const common = p.commonName?.toLowerCase() ?? '';
					return name.includes(q) || sci.includes(q) || common.includes(q);
				})
				.slice(0, 10)
				.map((p) => ({
					id: p.id,
					title: p.name || '',
					subtitle: p.scientificName || p.commonName || '',
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
			await plantMutations.create({
				name: parsed.name,
				acquiredAt: parsed.acquiredAt?.toISOString(),
			});
		},
	};
}
