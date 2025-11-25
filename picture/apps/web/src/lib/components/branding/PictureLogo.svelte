<script lang="ts">
	interface Props {
		size?: number;
		class?: string;
	}

	let { size = 48, class: className = '' }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 48 48"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class={className}
>
	<!-- Camera/Picture Frame -->
	<rect x="4" y="8" width="40" height="32" rx="4" fill="currentColor" opacity="0.1" />
	<rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" stroke-width="2" />

	<!-- Mountain/Landscape -->
	<path
		d="M8 36L18 22L24 30L32 18L40 36H8Z"
		fill="currentColor"
		opacity="0.2"
	/>
	<path
		d="M8 36L18 22L24 30L32 18L40 36"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>

	<!-- Sun -->
	<circle cx="36" cy="16" r="4" fill="currentColor" />

	<!-- Lens aperture hint at top -->
	<circle cx="24" cy="4" r="2" fill="currentColor" />
</svg>
