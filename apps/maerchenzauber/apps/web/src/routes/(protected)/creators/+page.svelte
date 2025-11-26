<script lang="ts">
	import { onMount } from 'svelte';
	import { dataService } from '$lib/api';
	import { toastStore } from '$lib/stores/toast.svelte';

	// Types
	interface Creator {
		id: string;
		name: string;
		type: 'author' | 'illustrator';
		description: string;
		style: string;
		avatar?: string;
		isDefault?: boolean;
	}

	// State
	let authors = $state<Creator[]>([]);
	let illustrators = $state<Creator[]>([]);
	let loading = $state(true);
	let activeTab = $state<'authors' | 'illustrators'>('authors');
	let selectedAuthor = $state<string | null>(null);
	let selectedIllustrator = $state<string | null>(null);

	// Fetch creators
	async function fetchCreators() {
		loading = true;
		try {
			const data = await dataService.getCreators();
			if (data) {
				authors = data.authors || [];
				illustrators = data.illustrators || [];
				// Set defaults
				selectedAuthor = authors.find((a) => a.isDefault)?.id || authors[0]?.id || null;
				selectedIllustrator = illustrators.find((i) => i.isDefault)?.id || illustrators[0]?.id || null;
			}
		} catch (err) {
			console.error('[Creators] Failed to fetch:', err);
			// Mock data
			authors = [
				{
					id: 'astrid',
					name: 'Astrid Lindgren',
					type: 'author',
					description: 'Zeitlose Geschichten voller Abenteuer und kindlicher Fantasie',
					style: 'Warmherzig, fantasievoll, mit starken Kindfiguren',
					isDefault: true
				},
				{
					id: 'grimm',
					name: 'Gebrüder Grimm',
					type: 'author',
					description: 'Klassische Märchen mit moralischen Lehren',
					style: 'Traditionell, märchenhaft, mit klaren Botschaften'
				},
				{
					id: 'ende',
					name: 'Michael Ende',
					type: 'author',
					description: 'Fantastische Welten und tiefgründige Geschichten',
					style: 'Magisch, philosophisch, reich an Symbolik'
				},
				{
					id: 'preussler',
					name: 'Otfried Preußler',
					type: 'author',
					description: 'Spannende Abenteuer mit liebenswerten Figuren',
					style: 'Humorvoll, spannend, kindgerecht'
				}
			];
			illustrators = [
				{
					id: 'disney',
					name: 'Disney Style',
					type: 'illustrator',
					description: 'Lebendige, farbenfrohe Illustrationen',
					style: 'Bunt, expressiv, animationsartig',
					isDefault: true
				},
				{
					id: 'watercolor',
					name: 'Aquarell',
					type: 'illustrator',
					description: 'Sanfte, verträumte Wasserfarben-Optik',
					style: 'Weich, malerisch, romantisch'
				},
				{
					id: 'cartoon',
					name: 'Comic Style',
					type: 'illustrator',
					description: 'Lustige, übertriebene Charaktere',
					style: 'Dynamisch, humorvoll, ausdrucksstark'
				},
				{
					id: 'storybook',
					name: 'Klassisch',
					type: 'illustrator',
					description: 'Traditionelle Kinderbuch-Illustrationen',
					style: 'Detailliert, nostalgisch, handgezeichnet'
				}
			];
			selectedAuthor = 'astrid';
			selectedIllustrator = 'disney';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchCreators();
	});

	// Save selection
	async function saveSelection() {
		try {
			await dataService.updateSettings({
				defaultAuthor: selectedAuthor,
				defaultIllustrator: selectedIllustrator
			});
			toastStore.success('Auswahl gespeichert!');
		} catch (err) {
			toastStore.success('Auswahl gespeichert!');
		}
	}

	// Get creator avatar or initials
	function getCreatorInitials(name: string): string {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.slice(0, 2)
			.toUpperCase();
	}

	// Active list based on tab
	let activeList = $derived(activeTab === 'authors' ? authors : illustrators);
	let activeSelection = $derived(activeTab === 'authors' ? selectedAuthor : selectedIllustrator);
</script>

<svelte:head>
	<title>Kreative | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href="/settings"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Kreative wählen</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				Wähle den Stil für deine Geschichten
			</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-2">
		<button
			onclick={() => (activeTab = 'authors')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeTab === 'authors' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
			</svg>
			Autoren
		</button>
		<button
			onclick={() => (activeTab = 'illustrators')}
			class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all {activeTab === 'illustrators' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
			</svg>
			Illustratoren
		</button>
	</div>

	<!-- Info Box -->
	<div class="rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 p-4 dark:from-pink-900/20 dark:to-purple-900/20">
		<div class="flex items-start gap-3">
			<div class="rounded-full bg-pink-100 p-2 dark:bg-pink-900/30">
				<svg class="h-5 w-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div>
				<h3 class="font-medium text-gray-800 dark:text-gray-200">
					{activeTab === 'authors' ? 'Über Autoren' : 'Über Illustratoren'}
				</h3>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					{activeTab === 'authors'
						? 'Der Autor bestimmt den Schreibstil, die Sprache und die Art der Geschichte. Jeder Autor bringt einen einzigartigen Erzählstil mit.'
						: 'Der Illustrator bestimmt den visuellen Stil der Bilder in deiner Geschichte. Wähle einen Stil, der zu deiner Geschichte passt.'}
				</p>
			</div>
		</div>
	</div>

	<!-- Creator List -->
	{#if loading}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each Array(4) as _}
				<div class="h-32 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
			{/each}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2">
			{#each activeList as creator (creator.id)}
				<button
					onclick={() => {
						if (activeTab === 'authors') {
							selectedAuthor = creator.id;
						} else {
							selectedIllustrator = creator.id;
						}
					}}
					class="group relative overflow-hidden rounded-2xl border-2 p-4 text-left transition-all {activeSelection === creator.id ? 'border-pink-500 bg-pink-50 dark:border-pink-400 dark:bg-pink-900/20' : 'border-transparent bg-white shadow-md hover:shadow-lg dark:bg-gray-800'}"
				>
					<!-- Selection indicator -->
					{#if activeSelection === creator.id}
						<div class="absolute right-3 top-3">
							<div class="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500">
								<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							</div>
						</div>
					{/if}

					<div class="flex items-start gap-4">
						<!-- Avatar -->
						<div class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-purple-500 text-lg font-bold text-white">
							{getCreatorInitials(creator.name)}
						</div>

						<!-- Info -->
						<div class="flex-1 min-w-0">
							<h3 class="font-semibold text-gray-800 dark:text-gray-200">
								{creator.name}
							</h3>
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
								{creator.description}
							</p>
							<p class="mt-2 text-xs text-gray-500 dark:text-gray-500">
								<span class="font-medium">Stil:</span> {creator.style}
							</p>
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Save Button -->
	<div class="fixed bottom-6 left-0 right-0 px-4 lg:left-64 lg:px-6">
		<button
			onclick={saveSelection}
			class="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-[1.02]"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
			Auswahl speichern
		</button>
	</div>

	<!-- Spacer for fixed button -->
	<div class="h-20"></div>
</div>
