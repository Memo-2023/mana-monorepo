<script lang="ts">
	// FAQ items
	const faqItems = [
		{
			question: 'Was ist Mana?',
			answer:
				'Mana ist die Währung in Märchenzauber, mit der du Geschichten und Charaktere erstellen kannst. Du erhältst jeden Monat kostenloses Mana oder kannst zusätzliches Mana kaufen.',
		},
		{
			question: 'Wie viel Mana kostet eine Geschichte?',
			answer:
				'Das Erstellen einer Geschichte kostet 10 Mana. Dies beinhaltet die KI-generierte Geschichte und alle Illustrationen.',
		},
		{
			question: 'Wie viel Mana kostet ein Charakter?',
			answer:
				'Das Erstellen eines neuen Charakters kostet 10 Mana. Du kannst Fotos hochladen oder eine Beschreibung eingeben, um deinen Charakter zu erstellen.',
		},
		{
			question: 'Was passiert mit archivierten Geschichten?',
			answer:
				'Archivierte Geschichten werden nicht gelöscht. Du kannst sie jederzeit im Archiv wiederherstellen oder endgültig löschen.',
		},
		{
			question: 'Kann ich meine Charaktere in mehreren Geschichten verwenden?',
			answer:
				'Ja! Einmal erstellte Charaktere können in beliebig vielen Geschichten verwendet werden, ohne zusätzliche Kosten.',
		},
		{
			question: 'In welchen Sprachen werden Geschichten erstellt?',
			answer:
				'Derzeit werden alle Geschichten auf Deutsch erstellt. Weitere Sprachen sind in Planung.',
		},
		{
			question: 'Wie lange dauert das Erstellen einer Geschichte?',
			answer:
				'Das Erstellen einer Geschichte dauert in der Regel 1-2 Minuten. Die KI schreibt die Geschichte und erstellt alle Illustrationen automatisch.',
		},
		{
			question: 'Kann ich Geschichten bearbeiten?',
			answer:
				'Aktuell können Geschichten nach der Erstellung nicht bearbeitet werden. Du kannst aber eine neue Geschichte mit angepasster Beschreibung erstellen.',
		},
	];

	// Expanded state
	let expandedIndex = $state<number | null>(null);

	function toggleFaq(index: number) {
		expandedIndex = expandedIndex === index ? null : index;
	}
</script>

<svelte:head>
	<title>Hilfe | Märchenzauber</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a
			href="/settings"
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 19l-7-7m0 0l7-7m-7 7h18"
				/>
			</svg>
		</a>
		<div>
			<h1 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Hilfe</h1>
			<p class="text-sm text-gray-500 dark:text-gray-400">Häufig gestellte Fragen und Support</p>
		</div>
	</div>

	<!-- FAQ Section -->
	<section class="space-y-3">
		{#each faqItems as item, index (index)}
			<div class="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-800">
				<button
					onclick={() => toggleFaq(index)}
					class="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
				>
					<span class="font-medium text-gray-800 dark:text-gray-200">{item.question}</span>
					<svg
						class="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform {expandedIndex === index
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>
				{#if expandedIndex === index}
					<div
						class="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
					>
						<p class="text-gray-600 dark:text-gray-300">{item.answer}</p>
					</div>
				{/if}
			</div>
		{/each}
	</section>

	<!-- Contact Section -->
	<section
		class="rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 p-6 text-white shadow-lg"
	>
		<h2 class="mb-2 text-lg font-semibold">Noch Fragen?</h2>
		<p class="mb-4 text-white/80">
			Wir helfen dir gerne! Kontaktiere uns per E-Mail und wir melden uns so schnell wie möglich.
		</p>
		<a
			href="mailto:support@maerchenzauber.app"
			class="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2.5 font-medium backdrop-blur transition-all hover:bg-white/30"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
				/>
			</svg>
			support@maerchenzauber.app
		</a>
	</section>

	<!-- Quick Links -->
	<section class="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
		<h2 class="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">Schnellzugriff</h2>
		<div class="grid grid-cols-2 gap-3">
			<a
				href="/subscription"
				class="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
						<path
							d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Mana kaufen</span>
			</a>
			<a
				href="/archive"
				class="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Archiv</span>
			</a>
			<a
				href="/stories/create"
				class="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300"
					>Geschichte erstellen</span
				>
			</a>
			<a
				href="/characters/create"
				class="flex items-center gap-3 rounded-xl bg-gray-50 p-3 transition-all hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
						/>
					</svg>
				</div>
				<span class="text-sm font-medium text-gray-700 dark:text-gray-300">Charakter erstellen</span
				>
			</a>
		</div>
	</section>

	<!-- App Info -->
	<div class="text-center text-sm text-gray-500 dark:text-gray-400">
		<p>Märchenzauber v1.0.0</p>
		<p class="mt-1">Made with magic</p>
	</div>
</div>
