<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale, _ } from 'svelte-i18n';

	type HelpSection = 'faq' | 'features' | 'shortcuts' | 'contact';

	let activeSection = $state<HelpSection>('faq');
	let searchQuery = $state('');
	let expandedFaqId = $state<string | null>('faq-1');

	// FAQ data
	const faqs = $derived(
		$locale === 'de'
			? [
					{
						id: 'faq-1',
						question: 'Wie importiere ich Kontakte aus Google?',
						answer:
							'Um Kontakte aus Google zu importieren: Gehe zu Daten > Import, wähle Google Kontakte, melde dich bei deinem Google-Konto an, wähle die Kontakte aus und klicke auf Importieren.',
						category: 'features',
					},
					{
						id: 'faq-2',
						question: 'Wie exportiere ich meine Kontakte?',
						answer:
							'Du kannst deine Kontakte in verschiedenen Formaten exportieren: Gehe zu Daten > Export, wähle das gewünschte Format (vCard, CSV, JSON) und klicke auf Exportieren.',
						category: 'features',
					},
					{
						id: 'faq-3',
						question: 'Wie finde ich doppelte Kontakte?',
						answer:
							'Wir erkennen automatisch potenzielle Duplikate. Gehe zu Duplikate in der Seitenleiste, überprüfe die Vorschläge und wähle Zusammenführen oder Ignorieren.',
						category: 'features',
					},
					{
						id: 'faq-4',
						question: 'Wie kann ich mein Abo kündigen?',
						answer:
							'Du kannst dein Abo jederzeit kündigen: Gehe zu Einstellungen > Abonnement > Abo verwalten > Abo kündigen. Dein Abo bleibt bis zum Ende des Abrechnungszeitraums aktiv.',
						category: 'billing',
					},
					{
						id: 'faq-5',
						question: 'Wie werden meine Daten geschützt?',
						answer:
							'Wir nehmen deinen Datenschutz ernst: Alle Daten werden verschlüsselt (TLS), wir sind DSGVO-konform, verkaufen keine Daten und du kannst jederzeit alle Daten exportieren oder dein Konto löschen.',
						category: 'privacy',
					},
				]
			: [
					{
						id: 'faq-1',
						question: 'How do I import contacts from Google?',
						answer:
							'To import contacts from Google: Go to Data > Import, select Google Contacts, sign in to your Google account, select the contacts you want to import, and click Import.',
						category: 'features',
					},
					{
						id: 'faq-2',
						question: 'How do I export my contacts?',
						answer:
							'You can export your contacts in various formats: Go to Data > Export, select the desired format (vCard, CSV, JSON), and click Export.',
						category: 'features',
					},
					{
						id: 'faq-3',
						question: 'How do I find duplicate contacts?',
						answer:
							'We automatically detect potential duplicates. Go to Duplicates in the sidebar, review the suggestions, and choose to Merge or Ignore.',
						category: 'features',
					},
					{
						id: 'faq-4',
						question: 'How do I cancel my subscription?',
						answer:
							'You can cancel your subscription at any time: Go to Settings > Subscription > Manage Subscription > Cancel Subscription. Your subscription will remain active until the end of the billing period.',
						category: 'billing',
					},
					{
						id: 'faq-5',
						question: 'How is my data protected?',
						answer:
							'We take your privacy seriously: All data is encrypted (TLS), we are GDPR compliant, we never sell data, and you can export all your data or delete your account at any time.',
						category: 'privacy',
					},
				]
	);

	// Features data
	const features = $derived(
		$locale === 'de'
			? [
					{
						icon: '👥',
						title: 'Kontaktverwaltung',
						description: 'Verwalte alle deine Kontakte an einem Ort',
						highlights: [
							'Unbegrenzte Kontakte',
							'Benutzerdefinierte Felder',
							'Tags und Kategorien',
						],
					},
					{
						icon: '📤',
						title: 'Import & Export',
						description: 'Importiere und exportiere Kontakte in verschiedenen Formaten',
						highlights: ['Google Kontakte Sync', 'vCard Import/Export', 'CSV Import/Export'],
					},
					{
						icon: '🔍',
						title: 'Duplikat-Erkennung',
						description: 'Automatische Erkennung und Zusammenführung von Duplikaten',
						highlights: [
							'Intelligente Erkennung',
							'Ein-Klick Zusammenführung',
							'Überprüfungsmodus',
						],
					},
					{
						icon: '⭐',
						title: 'Favoriten',
						description: 'Markiere wichtige Kontakte als Favoriten',
						highlights: ['Schnellzugriff', 'Verschiedene Ansichten', 'Sortierung'],
					},
				]
			: [
					{
						icon: '👥',
						title: 'Contact Management',
						description: 'Manage all your contacts in one place',
						highlights: ['Unlimited contacts', 'Custom fields', 'Tags and categories'],
					},
					{
						icon: '📤',
						title: 'Import & Export',
						description: 'Import and export contacts in various formats',
						highlights: ['Google Contacts sync', 'vCard import/export', 'CSV import/export'],
					},
					{
						icon: '🔍',
						title: 'Duplicate Detection',
						description: 'Automatic detection and merging of duplicates',
						highlights: ['Smart detection', 'One-click merge', 'Review mode'],
					},
					{
						icon: '⭐',
						title: 'Favorites',
						description: 'Mark important contacts as favorites',
						highlights: ['Quick access', 'Multiple views', 'Sorting'],
					},
				]
	);

	// Keyboard shortcuts
	const shortcuts = [
		{ shortcut: 'Cmd/Ctrl + K', action: $locale === 'de' ? 'Suche öffnen' : 'Open search' },
		{ shortcut: 'Cmd/Ctrl + N', action: $locale === 'de' ? 'Neuer Kontakt' : 'New contact' },
		{ shortcut: 'Cmd/Ctrl + 1-6', action: $locale === 'de' ? 'Navigation' : 'Navigation' },
	];

	// Translations
	const t = $derived({
		title: $locale === 'de' ? 'Hilfe & Support' : 'Help & Support',
		subtitle:
			$locale === 'de'
				? 'Finde Antworten und lerne die App kennen'
				: 'Find answers and learn how to use the app',
		searchPlaceholder: $locale === 'de' ? 'Hilfe durchsuchen...' : 'Search help...',
		sections: {
			faq: 'FAQ',
			features: 'Features',
			shortcuts: $locale === 'de' ? 'Tastenkürzel' : 'Shortcuts',
			contact: $locale === 'de' ? 'Kontakt' : 'Contact',
		},
		back: $locale === 'de' ? 'Zurück' : 'Back',
		contactTitle: $locale === 'de' ? 'Support kontaktieren' : 'Contact Support',
		contactDescription:
			$locale === 'de'
				? 'Unser Support-Team hilft dir bei allen Fragen.'
				: 'Our support team is here to help you.',
		email: $locale === 'de' ? 'E-Mail senden' : 'Send email',
		responseTime: $locale === 'de' ? 'Antwortzeit: 24 Stunden' : 'Response time: 24 hours',
	});

	// Filter FAQs based on search
	const filteredFaqs = $derived(
		searchQuery.trim().length > 0
			? faqs.filter(
					(faq) =>
						faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
						faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: faqs
	);

	function toggleFaq(id: string) {
		expandedFaqId = expandedFaqId === id ? null : id;
	}

	function handleBack() {
		goto('/');
	}

	const sections: { id: HelpSection; label: string }[] = $derived([
		{ id: 'faq', label: t.sections.faq },
		{ id: 'features', label: t.sections.features },
		{ id: 'shortcuts', label: t.sections.shortcuts },
		{ id: 'contact', label: t.sections.contact },
	]);
</script>

<svelte:head>
	<title>{t.title} | Contacts</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<button
			type="button"
			class="mb-4 flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
			onclick={handleBack}
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			{t.back}
		</button>

		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
			{t.title}
		</h1>
		<p class="mt-1 text-gray-600 dark:text-gray-400">
			{t.subtitle}
		</p>
	</div>

	<!-- Search -->
	<div class="relative mb-8">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder={t.searchPlaceholder}
			class="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400"
		/>
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
			<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="mb-6 border-b border-gray-200 dark:border-gray-700">
		<nav class="-mb-px flex space-x-4 overflow-x-auto" aria-label="Help sections">
			{#each sections as section (section.id)}
				<button
					type="button"
					class="whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors"
					class:border-blue-500={activeSection === section.id}
					class:text-blue-600={activeSection === section.id}
					class:dark:text-blue-400={activeSection === section.id}
					class:border-transparent={activeSection !== section.id}
					class:text-gray-500={activeSection !== section.id}
					class:hover:text-gray-700={activeSection !== section.id}
					class:dark:text-gray-400={activeSection !== section.id}
					class:dark:hover:text-gray-300={activeSection !== section.id}
					onclick={() => (activeSection = section.id)}
				>
					{section.label}
				</button>
			{/each}
		</nav>
	</div>

	<!-- Content -->
	<div class="min-h-[400px]">
		<!-- FAQ Section -->
		{#if activeSection === 'faq'}
			<div class="space-y-0 divide-y divide-gray-200 dark:divide-gray-700">
				{#each filteredFaqs as faq (faq.id)}
					<div class="py-0">
						<button
							type="button"
							class="flex w-full items-center justify-between py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							onclick={() => toggleFaq(faq.id)}
						>
							<span class="pr-4 font-medium text-gray-900 dark:text-gray-100">
								{faq.question}
							</span>
							<span
								class="flex-shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400"
								class:rotate-180={expandedFaqId === faq.id}
							>
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</span>
						</button>

						{#if expandedFaqId === faq.id}
							<div class="pb-4 text-gray-600 dark:text-gray-300">
								{faq.answer}
							</div>
						{/if}
					</div>
				{/each}

				{#if filteredFaqs.length === 0}
					<p class="py-8 text-center text-gray-500 dark:text-gray-400">
						{$locale === 'de' ? 'Keine Ergebnisse gefunden' : 'No results found'}
					</p>
				{/if}
			</div>
		{/if}

		<!-- Features Section -->
		{#if activeSection === 'features'}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each features as feature}
					<div
						class="rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="mb-3 flex items-center gap-3">
							<span class="text-2xl">{feature.icon}</span>
							<h3 class="font-semibold text-gray-900 dark:text-gray-100">
								{feature.title}
							</h3>
						</div>

						<p class="mb-3 text-sm text-gray-600 dark:text-gray-400">
							{feature.description}
						</p>

						<ul class="space-y-1">
							{#each feature.highlights as highlight}
								<li class="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
									<svg
										class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									{highlight}
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Shortcuts Section -->
		{#if activeSection === 'shortcuts'}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm">
					<thead>
						<tr class="border-b border-gray-200 dark:border-gray-700">
							<th class="pb-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">Shortcut</th>
							<th class="pb-3 font-semibold text-gray-900 dark:text-gray-100">
								{$locale === 'de' ? 'Aktion' : 'Action'}
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 dark:divide-gray-800">
						{#each shortcuts as shortcut}
							<tr>
								<td class="py-3 pr-4">
									<kbd
										class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800 dark:bg-gray-800 dark:text-gray-200"
									>
										{shortcut.shortcut}
									</kbd>
								</td>
								<td class="py-3 text-gray-600 dark:text-gray-400">
									{shortcut.action}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Contact Section -->
		{#if activeSection === 'contact'}
			<div class="space-y-6">
				<div>
					<h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
						{t.contactTitle}
					</h2>
					<p class="text-gray-600 dark:text-gray-400">
						{t.contactDescription}
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					<a
						href="mailto:support@manacore.app"
						class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div>
							<p class="font-medium text-gray-900 dark:text-gray-100">
								{t.email}
							</p>
							<p class="text-sm text-gray-600 dark:text-gray-400">support@manacore.app</p>
						</div>
					</a>

					<div
						class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
						>
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div>
							<p class="font-medium text-gray-900 dark:text-gray-100">
								{$locale === 'de' ? 'Antwortzeit' : 'Response Time'}
							</p>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								{t.responseTime}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
