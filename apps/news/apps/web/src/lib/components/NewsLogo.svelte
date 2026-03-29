<script lang="ts">
	let { size = 48, color = '#10b981' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" rx="22" fill={color} />
	<rect x="22" y="25" width="56" height="50" rx="4" stroke="white" stroke-width="4" fill="none" />
	<line x1="30" y1="38" x2="55" y2="38" stroke="white" stroke-width="3" stroke-linecap="round" />
	<line x1="30" y1="48" x2="70" y2="48" stroke="white" stroke-width="3" stroke-linecap="round" />
	<line x1="30" y1="58" x2="65" y2="58" stroke="white" stroke-width="3" stroke-linecap="round" />
</svg>
