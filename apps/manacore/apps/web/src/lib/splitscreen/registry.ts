/**
 * Split-Screen App Registry
 *
 * Lazy-import registry for all app modules.
 * Each app has an ListView.svelte component that renders in split-screen.
 */

const APP_COMPONENTS = {
	todo: () => import('$lib/modules/todo/ListView.svelte'),
	calendar: () => import('$lib/modules/calendar/ListView.svelte'),
	contacts: () => import('$lib/modules/contacts/ListView.svelte'),
	chat: () => import('$lib/modules/chat/ListView.svelte'),
	picture: () => import('$lib/modules/picture/ListView.svelte'),
	cards: () => import('$lib/modules/cards/ListView.svelte'),
	zitare: () => import('$lib/modules/zitare/ListView.svelte'),
	mukke: () => import('$lib/modules/mukke/ListView.svelte'),
	storage: () => import('$lib/modules/storage/ListView.svelte'),
	presi: () => import('$lib/modules/presi/ListView.svelte'),
	inventar: () => import('$lib/modules/inventar/ListView.svelte'),
	photos: () => import('$lib/modules/photos/ListView.svelte'),
	skilltree: () => import('$lib/modules/skilltree/ListView.svelte'),
	citycorners: () => import('$lib/modules/citycorners/ListView.svelte'),
	times: () => import('$lib/modules/times/ListView.svelte'),
	context: () => import('$lib/modules/context/ListView.svelte'),
	questions: () => import('$lib/modules/questions/ListView.svelte'),
	nutriphi: () => import('$lib/modules/nutriphi/ListView.svelte'),
	planta: () => import('$lib/modules/planta/ListView.svelte'),
	uload: () => import('$lib/modules/uload/ListView.svelte'),
	calc: () => import('$lib/modules/calc/ListView.svelte'),
	moodlit: () => import('$lib/modules/moodlit/ListView.svelte'),
	memoro: () => import('$lib/modules/memoro/ListView.svelte'),
	playground: () => import('$lib/modules/playground/ListView.svelte'),
};

export type SplitAppId = keyof typeof APP_COMPONENTS;

export const SPLIT_APP_IDS = Object.keys(APP_COMPONENTS) as SplitAppId[];

/** Display names for each app (German UI). */
export const SPLIT_APP_LABELS: Record<SplitAppId, string> = {
	todo: 'Todo',
	calendar: 'Kalender',
	contacts: 'Kontakte',
	chat: 'Chat',
	picture: 'Picture',
	cards: 'Cards',
	zitare: 'Zitare',
	mukke: 'Mukke',
	storage: 'Storage',
	presi: 'Presi',
	inventar: 'Inventar',
	photos: 'Fotos',
	skilltree: 'SkillTree',
	citycorners: 'CityCorners',
	times: 'Times & Clock',
	context: 'Context',
	questions: 'Questions',
	nutriphi: 'NutriPhi',
	planta: 'Planta',
	uload: 'uLoad',
	calc: 'Calc',
	moodlit: 'Moodlit',
	memoro: 'Memoro',
	playground: 'Playground',
};

export async function loadAppComponent(appId: string) {
	const loader = APP_COMPONENTS[appId as SplitAppId];
	if (!loader) return null;
	const module = await loader();
	return module.default;
}
