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
	/**
	 * Update only the props of the currently-registered bar component.
	 * Use this from reactive blocks that frequently produce fresh prop
	 * objects (e.g. derived arrays) — calling `set(...)` in those
	 * places needlessly re-writes barComponent every tick, which
	 * notifies subscribers even when the component identity hasn't
	 * changed.
	 */
	setProps(props: Record<string, unknown>) {
		barProps = props;
	},
	clear() {
		barComponent = null;
		barProps = {};
	},
};
