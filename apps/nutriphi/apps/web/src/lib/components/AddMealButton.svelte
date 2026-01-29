<script lang="ts">
	import { Camera, PencilLine, Plus, X } from '@manacore/shared-icons';
	import { goto } from '$app/navigation';

	let isOpen = $state(false);

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function handlePhoto() {
		isOpen = false;
		goto('/add?type=photo');
	}

	function handleText() {
		isOpen = false;
		goto('/add?type=text');
	}
</script>

<div class="relative">
	<!-- Backdrop -->
	{#if isOpen}
		<button
			class="fixed inset-0 bg-black/50 z-40"
			onclick={() => (isOpen = false)}
			aria-label="Menü schließen"
		></button>
	{/if}

	<!-- Options -->
	{#if isOpen}
		<div class="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col gap-3 z-50">
			<button
				onclick={handlePhoto}
				class="flex items-center gap-3 px-5 py-3 bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-full shadow-lg hover:bg-[var(--color-background-elevated)] transition-all"
			>
				<Camera class="w-5 h-5 text-[var(--color-primary)]" />
				<span class="text-[var(--color-text-primary)] font-medium">Foto</span>
			</button>
			<button
				onclick={handleText}
				class="flex items-center gap-3 px-5 py-3 bg-[var(--color-background-card)] border border-[var(--color-border)] rounded-full shadow-lg hover:bg-[var(--color-background-elevated)] transition-all"
			>
				<PencilLine class="w-5 h-5 text-[var(--color-secondary)]" />
				<span class="text-[var(--color-text-primary)] font-medium">Text</span>
			</button>
		</div>
	{/if}

	<!-- Main Button -->
	<button
		onclick={toggleMenu}
		class="w-14 h-14 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-lg flex items-center justify-center transition-all z-50 relative"
		class:rotate-45={isOpen}
	>
		{#if isOpen}
			<X class="w-6 h-6 text-white" />
		{:else}
			<Plus class="w-6 h-6 text-white" />
		{/if}
	</button>
</div>
