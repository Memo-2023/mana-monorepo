<script lang="ts">
	import ColorPicker from '../ColorPicker.svelte';
	import { TAG_COLORS, DEFAULT_TAG_COLOR } from './constants';

	/**
	 * Tag-specific color picker using the standard TAG_COLORS palette.
	 * Wrapper around the generic ColorPicker.
	 */

	interface Props {
		selectedColor?: string;
		onColorChange: (color: string) => void;
		size?: 'sm' | 'md' | 'lg';
	}

	let { selectedColor = DEFAULT_TAG_COLOR, onColorChange, size = 'md' }: Props = $props();

	const colors = TAG_COLORS.map((c) => c.hex);
</script>

<ColorPicker {colors} {selectedColor} {onColorChange} {size} label="Tag color" />
