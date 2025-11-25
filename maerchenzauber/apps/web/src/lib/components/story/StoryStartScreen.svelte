<script lang="ts">
	interface Props {
		title: string;
		characterName?: string;
		characterImage?: string;
		onStart: () => void;
	}

	let { title, characterName, characterImage, onStart }: Props = $props();
</script>

<div class="flex h-full w-full flex-col items-center justify-center p-8 text-center">
	<!-- Character Image -->
	{#if characterImage}
		<div class="mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-pink-500 shadow-lg shadow-pink-500/30 sm:h-40 sm:w-40">
			<img
				src={characterImage}
				alt={characterName || 'Charakter'}
				class="h-full w-full object-cover"
			/>
		</div>
	{/if}

	<!-- Title -->
	<h1 class="mb-4 max-w-2xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
		{title || 'Eine magische Geschichte'}
	</h1>

	<!-- Character Name -->
	{#if characterName}
		<p class="mb-8 text-lg text-pink-300 sm:text-xl">
			mit {characterName}
		</p>
	{/if}

	<!-- Start Button -->
	<button
		onclick={(e) => { e.stopPropagation(); onStart(); }}
		class="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700 hover:shadow-xl hover:scale-105"
	>
		<span>Geschichte starten</span>
		<svg class="h-6 w-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
		</svg>
	</button>

	<!-- Hint -->
	<p class="mt-8 text-sm text-white/50">
		Klicke oder drücke die Leertaste zum Fortfahren
	</p>
</div>
