<script lang="ts">
	let { size = 48, color = '#7c3aed' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" rx="22" fill={color} />
	<circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="4" />
	<circle cx="50" cy="50" r="10" fill="white" opacity="0.6" />
	<circle cx="35" cy="35" r="5" fill="white" opacity="0.4" />
	<circle cx="65" cy="35" r="5" fill="white" opacity="0.4" />
</svg>
