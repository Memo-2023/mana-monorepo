<!--
  DynamicIcon — renders a Phosphor icon by string name.
  Uses the curated icon registry from @mana/shared-icons.

  Usage:
    <DynamicIcon name="coffee" size={24} weight="bold" />
-->
<script lang="ts">
	import { getIconComponent } from '@mana/shared-icons';

	interface Props {
		name: string;
		size?: number;
		weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
		class?: string;
		color?: string;
	}

	let { name, size = 24, weight = 'regular', class: className = '', color }: Props = $props();

	let IconComponent = $derived(getIconComponent(name));
</script>

{#if IconComponent}
	<IconComponent {size} {weight} class={className} {color} />
{/if}
