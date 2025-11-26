<script lang="ts">
	import { goto } from '$app/navigation';

	// Types
	interface StoryTemplate {
		id: string;
		title: string;
		description: string;
		prompt: string;
		category: 'adventure' | 'fantasy' | 'educational' | 'bedtime' | 'seasonal';
		icon: string;
		color: string;
	}

	// State
	let activeCategory = $state<'all' | StoryTemplate['category']>('all');
	let searchQuery = $state('');

	// Templates
	const templates: StoryTemplate[] = [
		// Adventure
		{
			id: 'treasure-hunt',
			title: 'Schatzsuche',
			description: 'Ein spannendes Abenteuer auf der Suche nach einem versteckten Schatz',
			prompt: 'Eine spannende Geschichte über eine Schatzsuche mit Hinweisen und Rätseln',
			category: 'adventure',
			icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
			color: 'from-amber-400 to-orange-500'
		},
		{
			id: 'space-journey',
			title: 'Weltraumreise',
			description: 'Eine Reise zu den Sternen und fremden Planeten',
			prompt: 'Ein Weltraumabenteuer mit Raumschiffen, fremden Planeten und freundlichen Aliens',
			category: 'adventure',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z',
			color: 'from-indigo-400 to-purple-500'
		},
		{
			id: 'jungle-explorer',
			title: 'Dschungel-Expedition',
			description: 'Entdecke geheimnisvolle Tiere im Dschungel',
			prompt: 'Eine Expedition durch den Dschungel mit exotischen Tieren und versteckten Tempeln',
			category: 'adventure',
			icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
			color: 'from-green-400 to-emerald-500'
		},
		// Fantasy
		{
			id: 'dragon-friend',
			title: 'Drachenfreundschaft',
			description: 'Eine Freundschaft mit einem kleinen Drachen',
			prompt: 'Eine herzerwärmende Geschichte über Freundschaft mit einem jungen Drachen',
			category: 'fantasy',
			icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
			color: 'from-red-400 to-rose-500'
		},
		{
			id: 'magic-kingdom',
			title: 'Magisches Königreich',
			description: 'Abenteuer in einem verzauberten Schloss',
			prompt: 'Eine Geschichte in einem magischen Königreich mit Prinzen, Prinzessinnen und Zauberern',
			category: 'fantasy',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			color: 'from-purple-400 to-pink-500'
		},
		{
			id: 'unicorn-adventure',
			title: 'Einhorn-Abenteuer',
			description: 'Reise mit einem magischen Einhorn',
			prompt: 'Eine magische Reise auf dem Rücken eines Einhorns durch Regenbogenwelten',
			category: 'fantasy',
			icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
			color: 'from-pink-400 to-fuchsia-500'
		},
		// Educational
		{
			id: 'colors-world',
			title: 'Die Welt der Farben',
			description: 'Lerne Farben auf spielerische Weise',
			prompt: 'Eine lehrreiche Geschichte über Farben und wie sie die Welt bunter machen',
			category: 'educational',
			icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
			color: 'from-cyan-400 to-blue-500'
		},
		{
			id: 'counting-adventure',
			title: 'Zahlen-Abenteuer',
			description: 'Zählen lernen mit lustigen Tieren',
			prompt: 'Eine Geschichte mit Tieren, die beim Zählen lernen von 1 bis 10 helfen',
			category: 'educational',
			icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
			color: 'from-teal-400 to-cyan-500'
		},
		// Bedtime
		{
			id: 'sleepy-moon',
			title: 'Der müde Mond',
			description: 'Eine beruhigende Gutenachtgeschichte',
			prompt: 'Eine sanfte Gutenachtgeschichte über den Mond, der alle Kinder schlafen legt',
			category: 'bedtime',
			icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
			color: 'from-indigo-400 to-violet-500'
		},
		{
			id: 'star-dream',
			title: 'Sternentraum',
			description: 'Reise durch die Träume zu den Sternen',
			prompt: 'Eine traumhafte Reise zu den Sternen mit sanften Wolken und friedlichen Himmelsfreunden',
			category: 'bedtime',
			icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
			color: 'from-blue-400 to-indigo-500'
		},
		// Seasonal
		{
			id: 'christmas-magic',
			title: 'Weihnachtszauber',
			description: 'Magische Weihnachtsgeschichte',
			prompt: 'Eine herzerwärmende Weihnachtsgeschichte mit dem Weihnachtsmann und seinen Helfern',
			category: 'seasonal',
			icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
			color: 'from-red-500 to-green-500'
		},
		{
			id: 'easter-bunny',
			title: 'Osterhase Abenteuer',
			description: 'Hilf dem Osterhasen bei der Eiersuche',
			prompt: 'Ein fröhliches Osterabenteuer mit dem Osterhasen und bunten Ostereiern',
			category: 'seasonal',
			icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
			color: 'from-yellow-400 to-pink-400'
		}
	];

	// Categories
	const categories = [
		{ id: 'all', label: 'Alle', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
		{ id: 'adventure', label: 'Abenteuer', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
		{ id: 'fantasy', label: 'Fantasy', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
		{ id: 'educational', label: 'Lerngeschichten', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
		{ id: 'bedtime', label: 'Gutenacht', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
		{ id: 'seasonal', label: 'Saisonal', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' }
	];

	// Filter templates
	let filteredTemplates = $derived(
		templates.filter((t) => {
			const matchesCategory = activeCategory === 'all' || t.category === activeCategory;
			const matchesSearch =
				!searchQuery ||
				t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.description.toLowerCase().includes(searchQuery.toLowerCase());
			return matchesCategory && matchesSearch;
		})
	);

	// Use template
	function useTemplate(template: StoryTemplate) {
		// Navigate to story creation with pre-filled prompt
		goto(`/stories/create?prompt=${encodeURIComponent(template.prompt)}`);
	}
</script>

<svelte:head>
	<title>Vorlagen | Märchenzauber</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Story-Vorlagen</h1>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			Lass dich inspirieren oder starte direkt mit einer Vorlage
		</p>
	</div>

	<!-- Search -->
	<div class="relative">
		<svg class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
		</svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Vorlage suchen..."
			class="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
		/>
	</div>

	<!-- Categories -->
	<div class="flex flex-wrap gap-2">
		{#each categories as category}
			<button
				onclick={() => (activeCategory = category.id as typeof activeCategory)}
				class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all {activeCategory === category.id ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={category.icon} />
				</svg>
				{category.label}
			</button>
		{/each}
	</div>

	<!-- Templates Grid -->
	{#if filteredTemplates.length === 0}
		<div class="rounded-2xl bg-gray-50 p-8 text-center dark:bg-gray-800/50">
			<svg class="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
			</svg>
			<h3 class="mt-4 font-medium text-gray-700 dark:text-gray-300">Keine Vorlagen gefunden</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Versuche eine andere Suche oder Kategorie
			</p>
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each filteredTemplates as template (template.id)}
				<button
					onclick={() => useTemplate(template)}
					class="group relative overflow-hidden rounded-2xl bg-white p-5 text-left shadow-md transition-all hover:shadow-xl dark:bg-gray-800"
				>
					<!-- Gradient background -->
					<div class="absolute inset-0 bg-gradient-to-br {template.color} opacity-0 transition-opacity group-hover:opacity-10"></div>

					<!-- Icon -->
					<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br {template.color} shadow-lg">
						<svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={template.icon} />
						</svg>
					</div>

					<!-- Content -->
					<h3 class="font-semibold text-gray-800 dark:text-gray-200">
						{template.title}
					</h3>
					<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
						{template.description}
					</p>

					<!-- Use button overlay -->
					<div class="mt-4 flex items-center gap-2 text-sm font-medium text-pink-600 dark:text-pink-400">
						<span>Verwenden</span>
						<svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
						</svg>
					</div>
				</button>
			{/each}
		</div>
	{/if}

	<!-- Custom story CTA -->
	<div class="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white">
		<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
			<div>
				<h3 class="text-lg font-semibold">Eigene Geschichte erstellen</h3>
				<p class="mt-1 text-sm text-white/80">
					Keine passende Vorlage? Erstelle deine eigene einzigartige Geschichte!
				</p>
			</div>
			<a
				href="/stories/create"
				class="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-pink-600 shadow-lg transition-transform hover:scale-105"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				Neue Geschichte
			</a>
		</div>
	</div>
</div>
