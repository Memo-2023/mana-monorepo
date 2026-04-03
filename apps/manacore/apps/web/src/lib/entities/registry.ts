/**
 * Entity Registry — Collects module descriptors and orchestrates cross-module drops.
 */

import type { DragType } from '@manacore/shared-ui/dnd';
import { linkMutations, buildCachedData } from '@manacore/shared-links';
import type { EntityDescriptor, DropResult } from './types';

const entities = new Map<string, EntityDescriptor>();

export function registerEntity(descriptor: EntityDescriptor): void {
	entities.set(descriptor.appId, descriptor);
}

export function getEntity(appId: string): EntityDescriptor | undefined {
	return entities.get(appId);
}

export function getEntityByDragType(type: DragType): EntityDescriptor | undefined {
	for (const e of entities.values()) {
		if (e.dragType === type) return e;
	}
	return undefined;
}

export function canDrop(sourceType: DragType, targetAppId: string): boolean {
	const target = entities.get(targetAppId);
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
	const source = entities.get(sourceAppId);
	const target = entities.get(targetAppId);
	if (!source || !target)
		throw new Error(`Entity not registered: ${sourceAppId} or ${targetAppId}`);
	if (!target.createItem) throw new Error(`Target ${targetAppId} has no createItem`);

	const transform = target.transformIncoming?.[source.dragType];
	if (!transform) throw new Error(`No transform for ${source.dragType} → ${targetAppId}`);

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

export function getAllEntities(): EntityDescriptor[] {
	return Array.from(entities.values());
}
