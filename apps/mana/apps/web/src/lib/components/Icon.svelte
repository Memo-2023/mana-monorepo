<!--
  Icon Component — Thin wrapper around DynamicIcon from shared-ui.
  Renders a Phosphor icon by string name from the curated registry.

  Usage:
    <Icon name="coffee" size={24} class="text-blue-500" />
-->
<script lang="ts">
	import { DynamicIcon } from '@mana/shared-ui/atoms';

	interface Props {
		name: string;
		size?: number;
		class?: string;
		color?: string;
	}

	let { name, size = 24, class: className = '', color }: Props = $props();
</script>

<DynamicIcon {name} {size} class={className} {color} />
