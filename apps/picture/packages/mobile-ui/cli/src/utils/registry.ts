import fs from 'fs-extra';
import { type ComponentRegistry, type ComponentInfo } from '../types';
import { getRegistryPath } from './paths';

/**
 * Load the component registry
 */
export async function loadRegistry(): Promise<ComponentRegistry> {
	const registryPath = getRegistryPath();

	if (!(await fs.pathExists(registryPath))) {
		throw new Error(`Registry not found at ${registryPath}`);
	}

	const content = await fs.readFile(registryPath, 'utf-8');
	return JSON.parse(content);
}

/**
 * Get a specific component from the registry
 */
export async function getComponent(
	componentKey: string
): Promise<{ key: string; component: ComponentInfo; category: string } | null> {
	const registry = await loadRegistry();

	for (const [category, components] of Object.entries(registry.components)) {
		if (componentKey in components) {
			return {
				key: componentKey,
				component: components[componentKey],
				category,
			};
		}
	}

	return null;
}

/**
 * Get all components from the registry
 */
export async function getAllComponents(): Promise<
	Array<{ key: string; component: ComponentInfo; category: string }>
> {
	const registry = await loadRegistry();
	const components: Array<{ key: string; component: ComponentInfo; category: string }> = [];

	for (const [category, categoryComponents] of Object.entries(registry.components)) {
		for (const [key, component] of Object.entries(categoryComponents)) {
			components.push({ key, component, category });
		}
	}

	return components;
}

/**
 * Resolve dependencies for a component recursively
 */
export async function resolveDependencies(
	componentKey: string,
	visited = new Set<string>()
): Promise<string[]> {
	if (visited.has(componentKey)) {
		return [];
	}

	visited.add(componentKey);

	const item = await getComponent(componentKey);
	if (!item) {
		return [];
	}

	const deps = item.component.dependencies || [];
	const allDeps = [...deps];

	for (const dep of deps) {
		const subDeps = await resolveDependencies(dep, visited);
		allDeps.push(...subDeps);
	}

	return [...new Set(allDeps)];
}
