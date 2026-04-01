<script lang="ts">
	import AppLogo from '../AppLogo.svelte';

	interface Props {
		size?: number;
		color?: string;
		class?: string;
	}

	let { size = 55, color, class: className = '' }: Props = $props();
</script>

<AppLogo app="manadeck" {size} {color} class={className} />
