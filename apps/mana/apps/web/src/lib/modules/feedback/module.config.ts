/**
 * Feedback module — server-only public-feedback hub. No Dexie tables,
 * so the module-config is mostly nominal (registers the appId for
 * module-context tagging on inline FeedbackHook submissions).
 */

import type { ModuleConfig } from '$lib/data/module-registry';

export const feedbackModuleConfig: ModuleConfig = {
	appId: 'feedback',
	tables: [],
};
