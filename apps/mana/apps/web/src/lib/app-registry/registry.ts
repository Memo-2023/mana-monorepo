/**
 * Unified App Registry — Collects app descriptors and orchestrates cross-module drops.
 */

import type { DragType } from '@mana/shared-ui/dnd';
import { linkMutations, buildCachedData } from '@mana/shared-links';
import { MANA_APPS, hasAppAccess, type AccessTier } from '@mana/shared-branding';
import type { AppDescriptor, DropResult } from './types';

const apps = new Map<string, AppDescriptor>();

export function registerApp(descriptor: AppDescriptor): void {
	apps.set(descriptor.id, descriptor);
}

export function getApp(appId: string): AppDescriptor | undefined {
	return apps.get(appId);
}

export function getAppByDragType(type: DragType): AppDescriptor | undefined {
	for (const a of apps.values()) {
		if (a.dragType === type) return a;
	}
	return undefined;
}

export function canDrop(sourceType: DragType, targetAppId: string): boolean {
	const target = apps.get(targetAppId);
	if (!target?.acceptsDropFrom?.includes(sourceType)) return false;
	if (!target.createItem) return false;
	if (!target.transformIncoming?.[sourceType]) return false;
	return true;
}

export async function executeDrop(
	sourceItem: Record<string, unknown>,
	sourceAppId: string,
	targetAppId: string
): Promise<DropResult> {
	const source = apps.get(sourceAppId);
	const target = apps.get(targetAppId);
	if (!source || !target) throw new Error(`App not registered: ${sourceAppId} or ${targetAppId}`);
	if (!target.createItem) throw new Error(`Target ${targetAppId} has no createItem`);
	if (!source.dragType) throw new Error(`Source ${sourceAppId} has no dragType`);
	if (!source.collection) throw new Error(`Source ${sourceAppId} has no collection`);
	if (!target.collection) throw new Error(`Target ${targetAppId} has no collection`);
	if (!source.getDisplayData) throw new Error(`Source ${sourceAppId} has no getDisplayData`);
	if (!target.getDisplayData) throw new Error(`Target ${targetAppId} has no getDisplayData`);

	const transform = target.transformIncoming?.[source.dragType];
	if (!transform) throw new Error(`No transform for ${source.dragType} -> ${targetAppId}`);

	// 1. Transform source data into target shape
	const transformedData = transform(sourceItem);

	// 2. Create new item in target module
	const newItemId = await target.createItem(transformedData);

	// 3. Build cached display data for link
	const sourceDisplay = source.getDisplayData(sourceItem);
	const targetDisplay = target.getDisplayData({ ...transformedData, id: newItemId });

	const cachedSource = buildCachedData(sourceAppId, sourceDisplay.title, sourceDisplay.subtitle);
	const cachedTarget = buildCachedData(targetAppId, targetDisplay.title, targetDisplay.subtitle);

	// 4. Create bidirectional link
	const { forward } = await linkMutations.createLink({
		sourceApp: sourceAppId,
		sourceCollection: source.collection,
		sourceId: sourceItem.id as string,
		targetApp: targetAppId,
		targetCollection: target.collection,
		targetId: newItemId,
		linkType: 'related',
		cachedSource,
		cachedTarget,
	});

	return { newItemId, linkPairId: forward.pairId };
}

export function getAllApps(): AppDescriptor[] {
	return Array.from(apps.values());
}

/**
 * Looks up the access tier for a workbench-registry app via the canonical
 * @mana/shared-branding MANA_APPS list. The two registries are intentionally
 * separate (workbench needs createItem/dragType/views; MANA_APPS holds tier
 * + branding metadata), so the join happens by `id`.
 *
 * Returns null when there is no matching MANA_APPS entry. Internal-only
 * tools that exist in the workbench but not in MANA_APPS (`automations`,
 * `playground`) fall into this case — `getAccessibleApps` then treats
 * them as visible by default rather than hiding them for everyone, since
 * the alternative is a silent regression for founders/devs.
 */
function getAppRequiredTier(appId: string): AccessTier | null {
	const branding = MANA_APPS.find((a) => a.id === appId);
	return branding?.requiredTier ?? null;
}

/**
 * Returns workbench apps the given user tier may access. Used by the
 * AppPagePicker to hide gated modules from the "add page" picker, and
 * by the workbench layout to soft-filter `openApps` so seeded / migrated
 * scenes don't render gated content for downgraded users or guests.
 *
 * Tier semantics (from @mana/shared-branding):
 *   guest(0) < public(1) < beta(2) < alpha(3) < founder(4)
 *
 * Pass `undefined` (no signed-in user) → treated as `'guest'`. The
 * default behaviour for apps with NO MANA_APPS entry is "visible" (see
 * `getAppRequiredTier` rationale above).
 */
export function getAccessibleApps(userTier?: string | null): AppDescriptor[] {
	const tier = userTier ?? 'guest';
	return Array.from(apps.values()).filter((app) => {
		const required = getAppRequiredTier(app.id);
		if (!required) return true;
		return hasAppAccess(tier, required);
	});
}

/** Single-app version of `getAccessibleApps`. Returns true when the
 *  given user tier may use this app. Used by the (app) layout's
 *  per-route tier check so direct URL navigation to a gated module
 *  is blocked for users without access. */
export function isAppAccessible(appId: string, userTier?: string | null): boolean {
	const required = getAppRequiredTier(appId);
	if (!required) return true;
	return hasAppAccess(userTier ?? 'guest', required);
}
