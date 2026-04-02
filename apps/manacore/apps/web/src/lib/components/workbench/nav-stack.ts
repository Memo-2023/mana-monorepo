/**
 * Panel Navigation Stack — Types for in-panel view navigation.
 *
 * Each workbench panel manages its own navigation stack.
 * Views are pushed/popped within the panel (list → detail → edit).
 */

import type { Component } from 'svelte';

export interface NavFrame {
	viewName: string;
	params: Record<string, unknown>;
	component: Component | null;
}

export interface ViewProps {
	navigate: (viewName: string, params?: Record<string, unknown>) => void;
	goBack: () => void;
	params: Record<string, unknown>;
}
