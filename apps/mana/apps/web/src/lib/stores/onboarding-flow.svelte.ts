/**
 * Ephemeral state for the three-screen onboarding flow — holds values
 * a later screen needs from an earlier screen (the freshly-typed name
 * for Screen 2's greeting, the multi-selected template ids for the
 * Screen 3 finish handler).
 *
 * Deliberately module-local and non-persistent:
 *   - The canonical source of truth is `authStore.user` (name) and the
 *     scene Dexie table (apps). This store only bridges screens inside
 *     a single session.
 *   - We can't mutate `authStore.user.name` after PATCH /me/profile
 *     because `user` is minted from the JWT; the in-memory value only
 *     catches up on the next token refresh. This store lets Screen 2
 *     greet the user immediately with what they just typed.
 *   - Reset on flow completion so a `markComplete → reset → revisit`
 *     from settings starts fresh.
 */

let pendingName = $state<string | null>(null);
let selectedTemplateIds = $state<string[]>([]);

export const onboardingFlow = {
	get pendingName() {
		return pendingName;
	},
	get selectedTemplateIds() {
		return selectedTemplateIds;
	},
	setPendingName(value: string) {
		pendingName = value.trim() || null;
	},
	setSelectedTemplateIds(ids: string[]) {
		selectedTemplateIds = ids;
	},
	reset() {
		pendingName = null;
		selectedTemplateIds = [];
	},
};
