<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 55, color = '#8b5cf6' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<!-- Cards/Deck icon -->
	<rect x="2" y="4" width="20" height="16" rx="2" />
	<path d="M6 2v2" />
	<path d="M18 2v2" />
	<path d="M6 20v2" />
	<path d="M18 20v2" />
	<path d="M2 10h20" />
</svg>
