import type { Component } from 'svelte';

export interface CarouselPage {
	id: string;
	maximized?: boolean;
	widthPx: number;
	heightPx?: number;
	title: string;
	color: string;
	icon?: Component;
}
