/**
 * Bottom Bar Slot — allows pages to inject a component into the layout's
 * bottom-stack (above notifications, below the page content).
 *
 * Usage:
 *   Page sets:   bottomBarStore.set(MyBarComponent, { myProp: value })
 *   Layout reads: bottomBarStore.component / bottomBarStore.props
 *   Page clears:  bottomBarStore.clear()  (onDestroy)
 */

import type { Component } from 'svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let barComponent = $state<Component<any> | null>(null);
let barProps = $state<Record<string, unknown>>({});

export const bottomBarStore = {
	get component() {
		return barComponent;
	},
	get props() {
		return barProps;
	},
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	set(component: Component<any>, props: Record<string, unknown> = {}) {
		barComponent = component;
		barProps = props;
	},
	clear() {
		barComponent = null;
		barProps = {};
	},
};
