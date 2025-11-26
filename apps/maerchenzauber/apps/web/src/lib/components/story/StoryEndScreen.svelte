<script lang="ts">
	interface Props {
		onClose: () => void;
		onRestart: () => void;
		onArchive?: () => void;
	}

	let { onClose, onRestart, onArchive }: Props = $props();
</script>

<div class="flex h-full w-full flex-col items-center justify-center p-8 text-center">
	<!-- Celebration Icon -->
	<div class="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30">
		<svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
		</svg>
	</div>

	<!-- Title -->
	<h2 class="mb-2 text-3xl font-bold text-white sm:text-4xl">
		Ende
	</h2>

	<p class="mb-8 text-lg text-white/70">
		Das war's! Was möchtest du als nächstes tun?
	</p>

	<!-- Actions -->
	<div class="flex flex-col gap-3 sm:flex-row">
		<!-- Restart -->
		<button
			onclick={(e) => { e.stopPropagation(); onRestart(); }}
			class="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white backdrop-blur transition-all hover:bg-white/20"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Nochmal lesen
		</button>

		<!-- Back to Stories -->
		<button
			onclick={(e) => { e.stopPropagation(); onClose(); }}
			class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 font-medium text-white shadow-lg transition-all hover:from-pink-600 hover:to-purple-700"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
			</svg>
			Zur Übersicht
		</button>

		<!-- Archive -->
		{#if onArchive}
			<button
				onclick={(e) => { e.stopPropagation(); onArchive?.(); }}
				class="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-medium text-white/70 backdrop-blur transition-all hover:bg-white/20 hover:text-white"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
				</svg>
				Archivieren
			</button>
		{/if}
	</div>
</div>
