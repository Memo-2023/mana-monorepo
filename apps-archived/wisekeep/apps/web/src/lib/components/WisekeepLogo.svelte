<script lang="ts">
	let { size = 48, color = '#8b5cf6' }: { size?: number; color?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" rx="22" fill={color} />
	<circle cx="50" cy="40" r="12" stroke="white" stroke-width="4" fill="none" />
	<line x1="50" y1="52" x2="50" y2="72" stroke="white" stroke-width="4" stroke-linecap="round" />
	<line x1="38" y1="62" x2="50" y2="72" stroke="white" stroke-width="3" stroke-linecap="round" />
	<line x1="62" y1="62" x2="50" y2="72" stroke="white" stroke-width="3" stroke-linecap="round" />
</svg>
