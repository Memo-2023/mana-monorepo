import { waitLocale } from '$lib/i18n';
import '$lib/i18n'; // This triggers the init() call at module scope

export const load = async () => {
	await waitLocale();
	return {};
};
