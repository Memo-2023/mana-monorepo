<script lang="ts">
	import { Heart, Star, PushPin } from '@manacore/shared-icons';

	/**
	 * Reusable favorite/pin toggle button.
	 * Renders a heart, star, or pin icon that toggles between filled and outline.
	 */

	interface Props {
		active: boolean;
		onclick: () => void;
		/** Icon variant */
		variant?: 'heart' | 'star' | 'pin';
		/** Icon size in pixels */
		size?: number;
		/** Active color (CSS color) */
		activeColor?: string;
		/** Inactive color (CSS color) */
		inactiveColor?: string;
		/** Extra CSS classes on the button */
		class?: string;
		/** Accessible label */
		label?: string;
	}

	let {
		active,
		onclick,
		variant = 'heart',
		size = 18,
		activeColor = variant === 'pin' ? 'var(--color-primary, #3b82f6)' : '#ef4444',
		inactiveColor = 'currentColor',
		class: className = '',
		label,
	}: Props = $props();

	const defaultLabel = $derived(
		variant === 'pin'
			? active
				? 'Loslösen'
				: 'Anpinnen'
			: active
				? 'Favorit entfernen'
				: 'Favorit'
	);

	const icons = { heart: Heart, star: Star, pin: PushPin };
	const Icon = $derived(icons[variant]);
</script>

<button
	type="button"
	{onclick}
	class="inline-flex items-center justify-center rounded-md p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10 {className}"
	aria-label={label ?? defaultLabel}
	title={label ?? defaultLabel}
>
	<Icon
		{size}
		weight={active ? 'fill' : 'regular'}
		class="transition-colors"
		style="color: {active ? activeColor : inactiveColor}"
	/>
</button>
