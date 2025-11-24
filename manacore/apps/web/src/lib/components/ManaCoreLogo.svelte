<script lang="ts">
	interface Props {
		size?: number;
		color?: string;
	}

	let { size = 55, color = '#6366f1' }: Props = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
>
	<!-- M letter for ManaCore -->
	<text
		x="50%"
		y="55%"
		dominant-baseline="middle"
		text-anchor="middle"
		font-size="16"
		font-weight="bold"
		fill={color}
	>
		M
	</text>
</svg>
