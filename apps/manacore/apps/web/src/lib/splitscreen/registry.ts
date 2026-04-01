/**
 * Split-Screen App Registry
 *
 * Lazy-import registry for all app modules.
 * Each app has an AppView.svelte component that renders in split-screen.
 */

const APP_COMPONENTS = {
	todo: () => import('$lib/modules/todo/AppView.svelte'),
	calendar: () => import('$lib/modules/calendar/AppView.svelte'),
	contacts: () => import('$lib/modules/contacts/AppView.svelte'),
	chat: () => import('$lib/modules/chat/AppView.svelte'),
	picture: () => import('$lib/modules/picture/AppView.svelte'),
	cards: () => import('$lib/modules/cards/AppView.svelte'),
	zitare: () => import('$lib/modules/zitare/AppView.svelte'),
	clock: () => import('$lib/modules/clock/AppView.svelte'),
	mukke: () => import('$lib/modules/mukke/AppView.svelte'),
	storage: () => import('$lib/modules/storage/AppView.svelte'),
	presi: () => import('$lib/modules/presi/AppView.svelte'),
	inventar: () => import('$lib/modules/inventar/AppView.svelte'),
	photos: () => import('$lib/modules/photos/AppView.svelte'),
	skilltree: () => import('$lib/modules/skilltree/AppView.svelte'),
	citycorners: () => import('$lib/modules/citycorners/AppView.svelte'),
	times: () => import('$lib/modules/times/AppView.svelte'),
	context: () => import('$lib/modules/context/AppView.svelte'),
	questions: () => import('$lib/modules/questions/AppView.svelte'),
	nutriphi: () => import('$lib/modules/nutriphi/AppView.svelte'),
	planta: () => import('$lib/modules/planta/AppView.svelte'),
	uload: () => import('$lib/modules/uload/AppView.svelte'),
	calc: () => import('$lib/modules/calc/AppView.svelte'),
	moodlit: () => import('$lib/modules/moodlit/AppView.svelte'),
	memoro: () => import('$lib/modules/memoro/AppView.svelte'),
	playground: () => import('$lib/modules/playground/AppView.svelte'),
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
	clock: 'Uhr',
	mukke: 'Mukke',
	storage: 'Storage',
	presi: 'Presi',
	inventar: 'Inventar',
	photos: 'Fotos',
	skilltree: 'SkillTree',
	citycorners: 'CityCorners',
	times: 'Times',
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
