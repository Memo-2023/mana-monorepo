<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import {
		Question,
		Star,
		Command,
		Envelope,
		MagnifyingGlass,
		CaretDown,
		Check,
		Info,
		ChatCircle,
		Clock,
		ArrowRight,
		ArrowLeft,
		ArrowSquareOut,
		BookOpen,
	} from '@manacore/shared-icons';

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
			class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:text-gray-900 hover:shadow-md dark:bg-white/10 dark:text-gray-400 dark:ring-white/10 dark:hover:bg-white/20 dark:hover:text-gray-100"
			onclick={handleBack}
		>
			<ArrowLeft size={14} />
			{t.back}
		</button>

		<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
			{t.title}
		</h1>
		<p class="mt-1 text-gray-600 dark:text-gray-400">
			{t.subtitle}
		</p>
	</div>

	<!-- Search - Glass Style -->
	<div class="relative mb-8">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder={t.searchPlaceholder}
			class="w-full rounded-full border border-gray-200 bg-white/80 py-3 pl-11 pr-4 text-sm text-gray-900 shadow-sm backdrop-blur-sm placeholder:text-gray-500 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-white/10 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-blue-500/50 dark:focus:bg-white/15 dark:focus:ring-blue-500/20"
		/>
		<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
			<MagnifyingGlass size={18} class="text-gray-400" />
		</div>
	</div>

	<!-- Navigation Pills -->
	<div class="mb-8 flex flex-wrap gap-2">
		{#each sections as section (section.id)}
			<button
				type="button"
				class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md {activeSection ===
				section.id
					? 'bg-blue-500 text-white ring-1 ring-blue-400 dark:bg-blue-600 dark:ring-blue-500'
					: 'bg-white/80 text-gray-700 ring-1 ring-gray-200 hover:bg-white dark:bg-white/10 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/20'}"
				onclick={() => (activeSection = section.id)}
			>
				{#if section.id === 'faq'}
					<Question size={16} />
				{:else if section.id === 'features'}
					<Star size={16} />
				{:else if section.id === 'shortcuts'}
					<Command size={16} />
				{:else if section.id === 'contact'}
					<Envelope size={16} />
				{/if}
				{section.label}
			</button>
		{/each}
	</div>

	<!-- Content -->
	<div class="min-h-[400px]">
		<!-- FAQ Section -->
		{#if activeSection === 'faq'}
			<div class="space-y-3">
				{#each filteredFaqs as faq (faq.id)}
					<div
						class="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all dark:bg-white/5 dark:ring-white/10 {expandedFaqId ===
						faq.id
							? 'ring-blue-300 dark:ring-blue-500/30'
							: ''}"
					>
						<button
							type="button"
							class="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50/50 dark:hover:bg-white/5"
							onclick={() => toggleFaq(faq.id)}
						>
							<span class="pr-4 font-medium text-gray-900 dark:text-gray-100">
								{faq.question}
							</span>
							<span
								class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 dark:bg-white/10 dark:text-gray-400 {expandedFaqId ===
								faq.id
									? 'rotate-180 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
									: ''}"
							>
								<CaretDown size={16} />
							</span>
						</button>

						{#if expandedFaqId === faq.id}
							<div
								class="border-t border-gray-100 bg-gray-50/50 px-4 py-4 text-gray-600 dark:border-white/5 dark:bg-white/5 dark:text-gray-300"
							>
								{faq.answer}
							</div>
						{/if}
					</div>
				{/each}

				{#if filteredFaqs.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-2xl bg-white/80 py-12 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10"
					>
						<MagnifyingGlass size={32} class="mb-3 text-gray-400" />
						<p class="text-gray-500 dark:text-gray-400">
							{$locale === 'de' ? 'Keine Ergebnisse gefunden' : 'No results found'}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Features Section -->
		{#if activeSection === 'features'}
			<div class="grid gap-4 sm:grid-cols-2">
				{#each features as feature}
					<div
						class="group rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-white/5 dark:ring-white/10"
					>
						<div class="mb-3 flex items-center gap-3">
							<span
								class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-xl transition-transform group-hover:scale-110 dark:bg-blue-500/20"
							>
								{feature.icon}
							</span>
							<h3 class="font-semibold text-gray-900 dark:text-gray-100">
								{feature.title}
							</h3>
						</div>

						<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
							{feature.description}
						</p>

						<ul class="space-y-2">
							{#each feature.highlights as highlight}
								<li class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
									<span
										class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20"
									>
										<Check size={12} class="text-green-600 dark:text-green-400" />
									</span>
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
			<div
				class="overflow-hidden rounded-2xl bg-white/80 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10"
			>
				<div class="divide-y divide-gray-100 dark:divide-white/5">
					{#each shortcuts as shortcut, i}
						<div
							class="flex items-center justify-between p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/5"
						>
							<span class="text-gray-700 dark:text-gray-300">{shortcut.action}</span>
							<kbd
								class="ml-4 flex-shrink-0 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-xs font-medium text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/10"
							>
								{shortcut.shortcut}
							</kbd>
						</div>
					{/each}
				</div>
			</div>

			<!-- Tip -->
			<div
				class="mt-4 flex items-start gap-3 rounded-2xl bg-blue-50/80 p-4 ring-1 ring-blue-100 backdrop-blur-sm dark:bg-blue-500/10 dark:ring-blue-500/20"
			>
				<Info size={20} class="mt-0.5 flex-shrink-0 text-blue-500" />
				<p class="text-sm text-blue-700 dark:text-blue-300">
					{$locale === 'de'
						? 'Tipp: Drücke Cmd/Ctrl + K, um jederzeit schnell zur Suche zu gelangen.'
						: 'Tip: Press Cmd/Ctrl + K to quickly access search anytime.'}
				</p>
			</div>
		{/if}

		<!-- Contact Section -->
		{#if activeSection === 'contact'}
			<div class="space-y-6">
				<!-- Header Card -->
				<div
					class="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg dark:from-blue-600 dark:to-blue-700"
				>
					<div class="flex items-center gap-3">
						<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
							<ChatCircle size={24} />
						</div>
						<div>
							<h2 class="text-lg font-semibold">{t.contactTitle}</h2>
							<p class="text-blue-100">{t.contactDescription}</p>
						</div>
					</div>
				</div>

				<!-- Contact Options -->
				<div class="grid gap-4 sm:grid-cols-2">
					<a
						href="mailto:support@manacore.app"
						class="group flex items-center gap-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-white/5 dark:ring-white/10"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-110 dark:bg-blue-500/20 dark:text-blue-400"
						>
							<Envelope size={22} />
						</div>
						<div>
							<p class="font-medium text-gray-900 dark:text-gray-100">
								{t.email}
							</p>
							<p class="text-sm text-gray-600 dark:text-gray-400">support@manacore.app</p>
						</div>
						<ArrowRight
							size={18}
							class="ml-auto text-gray-400 transition-transform group-hover:translate-x-1"
						/>
					</a>

					<div
						class="flex items-center gap-4 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10"
					>
						<div
							class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
						>
							<Clock size={22} />
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

				<!-- Additional Info -->
				<div
					class="rounded-2xl bg-gray-50/80 p-5 ring-1 ring-gray-200 backdrop-blur-sm dark:bg-white/5 dark:ring-white/10"
				>
					<h3 class="mb-3 font-medium text-gray-900 dark:text-gray-100">
						{$locale === 'de' ? 'Weitere Ressourcen' : 'Additional Resources'}
					</h3>
					<div class="space-y-2">
						<a
							href="https://manacore.app"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
						>
							<ArrowSquareOut size={14} />
							{$locale === 'de' ? 'Website besuchen' : 'Visit Website'}
						</a>
						<a
							href="https://manacore.app/docs"
							target="_blank"
							rel="noopener noreferrer"
							class="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
						>
							<BookOpen size={14} />
							{$locale === 'de' ? 'Dokumentation' : 'Documentation'}
						</a>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
