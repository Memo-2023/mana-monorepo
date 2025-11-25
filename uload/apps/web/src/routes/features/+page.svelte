<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let isSubmitting = $state(false);
	let showSuccess = $state(false);
	let votingInProgress = $state<string | null>(null);
	let statusFilter = $state('all');
	let sortBy = $state('votes');

	// Reactive filtering and sorting
	let filteredRequests = $derived(
		(data.featureRequests || [])
			.filter((req) => statusFilter === 'all' || req.status === statusFilter)
			.sort((a, b) => {
				if (sortBy === 'votes') return (b.vote_count || 0) - (a.vote_count || 0);
				if (sortBy === 'newest' && a.created && b.created) {
					return new Date(b.created).getTime() - new Date(a.created).getTime();
				}
				return 0;
			})
	);

	// Debug output
	$effect(() => {
		console.log('Feature requests from data:', data.featureRequests);
		console.log('Filtered requests:', filteredRequests);
	});

	function getStatusBadge(status: string) {
		const badges = {
			new: { text: 'Neu', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
			reviewed: {
				text: 'In Prüfung',
				class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
			},
			planned: {
				text: 'Geplant',
				class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
			},
			in_progress: {
				text: 'In Entwicklung',
				class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 animate-pulse'
			},
			completed: {
				text: 'Fertig',
				class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
			},
			rejected: {
				text: 'Abgelehnt',
				class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
			}
		};
		return badges[status] || badges.new;
	}

	function getCategoryIcon(category: string) {
		const icons = {
			ui: '🎨',
			performance: '⚡',
			integration: '🔌',
			security: '🔐',
			features: '✨',
			other: '💡'
		};
		return icons[category] || '💡';
	}

	const features = [
		{
			category: 'Link Management',
			icon: '🔗',
			items: [
				{
					title: 'Smart URL Shortening',
					description: 'Verwandle lange URLs in kurze, einprägsame Links mit einem Klick',
					icon: '✂️'
				},
				{
					title: 'Custom Short Codes',
					description: 'Erstelle eigene, personalisierte Kurz-URLs für deine Marke',
					icon: '✏️'
				},
				{
					title: 'Ordner Organisation',
					description: 'Organisiere Links in farbcodierten Ordnern mit Icons',
					icon: '📁'
				},
				{
					title: 'Tagging System',
					description: 'Verwende Tags mit Farben und Icons für bessere Organisation',
					icon: '🏷️'
				},
				{
					title: 'QR Code Generator',
					description: 'Erstelle anpassbare QR Codes in verschiedenen Formaten und Farben',
					icon: '📱'
				},
				{
					title: 'Bulk Operations',
					description: 'Verwalte mehrere Links gleichzeitig mit Massenaktionen',
					icon: '⚡'
				}
			]
		},
		{
			category: 'Sicherheit & Kontrolle',
			icon: '🔐',
			items: [
				{
					title: 'Passwortschutz',
					description: 'Sichere sensible Links mit individuellen Passwörtern',
					icon: '🔒'
				},
				{
					title: 'Ablaufdatum',
					description: 'Setze automatische Ablaufzeiten für temporäre Links',
					icon: '⏰'
				},
				{
					title: 'Click Limits',
					description: 'Limitiere die Anzahl der Aufrufe pro Link',
					icon: '🎯'
				},
				{
					title: 'Link Deaktivierung',
					description: 'Aktiviere und deaktiviere Links jederzeit nach Bedarf',
					icon: '🔄'
				},
				{
					title: 'SSL Verschlüsselung',
					description: 'Alle Daten sind mit modernster SSL-Technologie geschützt',
					icon: '🛡️'
				},
				{
					title: 'GDPR Konform',
					description: 'Vollständige DSGVO-Konformität für europäische Nutzer',
					icon: '🇪🇺'
				}
			]
		},
		{
			category: 'Analytics & Insights',
			icon: '📊',
			items: [
				{
					title: 'Echtzeit-Statistiken',
					description: 'Verfolge Klicks und Aktivitäten in Echtzeit',
					icon: '📈'
				},
				{
					title: 'Geräte-Analyse',
					description: 'Erkenne Mobile, Desktop und Tablet Zugriffe',
					icon: '💻'
				},
				{
					title: 'Browser-Statistiken',
					description: 'Detaillierte Aufschlüsselung nach Browsern',
					icon: '🌐'
				},
				{
					title: 'Geografische Daten',
					description: 'Sehe woher deine Besucher kommen',
					icon: '🗺️'
				},
				{
					title: 'Referrer Tracking',
					description: 'Verstehe von welchen Seiten Traffic kommt',
					icon: '🔍'
				},
				{
					title: 'Export Funktionen',
					description: 'Exportiere Analytics-Daten für weitere Analysen',
					icon: '📥'
				}
			]
		},
		{
			category: 'Personalisierung',
			icon: '🎨',
			items: [
				{
					title: 'Öffentliche Profile',
					description: 'Erstelle deine persönliche Link-Seite mit Bio und Social Links',
					icon: '👤'
				},
				{
					title: 'Custom Themes',
					description: 'Wähle aus 5 verschiedenen Themes oder nutze Dark Mode',
					icon: '🎭'
				},
				{
					title: 'Mehrsprachigkeit',
					description:
						'5 Sprachen verfügbar: Deutsch, Englisch, Französisch, Spanisch, Italienisch',
					icon: '🌍'
				},
				{
					title: 'Branded URLs',
					description: 'Links mit deinem Benutzernamen für bessere Wiedererkennung',
					icon: '🏆'
				},
				{
					title: 'Custom QR Codes',
					description: 'Passe QR Code Farben und Formate an deine Marke an',
					icon: '🎨'
				},
				{
					title: 'Profil QR Codes',
					description: 'Teile dein Profil einfach per QR Code',
					icon: '📲'
				}
			]
		},
		{
			category: 'Pro Features',
			icon: '⭐',
			items: [
				{
					title: 'Unbegrenzte Links',
					description: 'Keine Limits bei der Anzahl deiner Kurz-URLs',
					icon: '♾️'
				},
				{
					title: 'Erweiterte Analytics',
					description: 'Tiefgehende Einblicke und detaillierte Berichte',
					icon: '📊'
				},
				{
					title: 'Priority Support',
					description: 'Bevorzugter Support mit schnellen Antwortzeiten',
					icon: '🎖️'
				},
				{
					title: 'Keine Werbung',
					description: 'Werbefreie Nutzung für fokussiertes Arbeiten',
					icon: '🚫'
				},
				{
					title: 'Early Access',
					description: 'Sei der Erste bei neuen Features (Lifetime Plan)',
					icon: '🚀'
				}
			]
		}
	];

	const comparisons = [
		{ feature: 'Links pro Monat', free: '10', pro: 'Unbegrenzt' },
		{ feature: 'Analytics', free: 'Basis', pro: 'Erweitert' },
		{ feature: 'QR Codes', free: 'Standard', pro: 'Anpassbar' },
		{ feature: 'Custom Short Codes', free: '✓', pro: '✓' },
		{ feature: 'Passwortschutz', free: '✓', pro: '✓' },
		{ feature: 'Ablaufdatum', free: '✓', pro: '✓' },
		{ feature: 'Priority Support', free: '✗', pro: '✓' },
		{ feature: 'Werbefrei', free: '✗', pro: '✓' },
		{ feature: 'Export Funktionen', free: '✗', pro: '✓' }
	];
</script>

<svelte:head>
	<title>Features - ulo.ad | Alle Funktionen im Überblick</title>
	<meta
		name="description"
		content="Entdecke alle Features von ulo.ad: URL-Verkürzung, QR-Codes, Analytics, Passwortschutz und mehr. Der moderne Link-Shortener für Profis."
	/>
</svelte:head>

<Navigation user={data.user} currentPath={$page.url.pathname} />

<div class="min-h-screen bg-theme-background">
	<!-- Hero Section -->
	<div
		class="relative overflow-hidden bg-gradient-to-br from-theme-primary/10 to-theme-primary/5 px-4 py-16"
	>
		<div class="bg-grid-pattern absolute inset-0 opacity-5"></div>
		<div class="relative mx-auto max-w-7xl text-center">
			<h1 class="mb-6 text-5xl font-bold text-theme-text">
				Alles was du brauchst,<br />
				<span class="text-theme-primary">in einem Tool vereint</span>
			</h1>
			<p class="mx-auto mb-8 max-w-3xl text-xl text-theme-text-muted">
				Von einfacher URL-Verkürzung bis zu fortgeschrittenen Analytics und API-Integration. ulo.ad
				bietet dir alle Tools für professionelles Link-Management.
			</p>
			<div class="flex justify-center gap-4">
				<a
					href="/auth/register"
					class="rounded-lg bg-theme-primary px-6 py-3 font-medium text-theme-background transition-colors hover:bg-theme-primary-hover"
				>
					Jetzt starten
				</a>
				<a
					href="/pricing"
					class="rounded-lg bg-theme-surface px-6 py-3 font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
				>
					Preise ansehen
				</a>
			</div>
		</div>
	</div>

	<!-- Community Roadmap Section -->
	<div class="bg-theme-surface/50 px-4 py-16">
		<div class="mx-auto max-w-6xl">
			<div class="mb-12 text-center">
				<h2 class="mb-4 text-3xl font-bold text-theme-text">🚀 Community Roadmap</h2>
				<p class="text-xl text-theme-text-muted">Stimme für die Features, die dir wichtig sind!</p>
			</div>

			{#if filteredRequests.length > 0}
				<!-- Filters -->
				<div class="mb-8 flex flex-wrap justify-center gap-4">
					<div class="flex gap-2">
						<button
							onclick={() => (statusFilter = 'all')}
							class="rounded-lg px-4 py-2 transition-colors {statusFilter === 'all'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							Alle
						</button>
						<button
							onclick={() => (statusFilter = 'new')}
							class="rounded-lg px-4 py-2 transition-colors {statusFilter === 'new'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							Neu
						</button>
						<button
							onclick={() => (statusFilter = 'planned')}
							class="rounded-lg px-4 py-2 transition-colors {statusFilter === 'planned'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							Geplant
						</button>
						<button
							onclick={() => (statusFilter = 'in_progress')}
							class="rounded-lg px-4 py-2 transition-colors {statusFilter === 'in_progress'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							In Entwicklung
						</button>
					</div>

					<div class="flex gap-2">
						<button
							onclick={() => (sortBy = 'votes')}
							class="rounded-lg px-4 py-2 transition-colors {sortBy === 'votes'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							🔥 Beliebteste
						</button>
						<button
							onclick={() => (sortBy = 'newest')}
							class="rounded-lg px-4 py-2 transition-colors {sortBy === 'newest'
								? 'bg-theme-primary text-theme-background'
								: 'bg-theme-surface text-theme-text hover:bg-theme-surface-hover'}"
						>
							🆕 Neueste
						</button>
					</div>
				</div>

				<!-- Feature Requests List -->
				<div class="space-y-4">
					{#each filteredRequests as request}
						{@const isVoted = data.userVotedIds.includes(request.id)}
						{@const statusBadge = getStatusBadge(request.status)}
						{@const categoryIcon = getCategoryIcon(request.category)}

						<div
							class="rounded-xl bg-theme-surface p-6 shadow-lg transition-shadow hover:shadow-xl"
						>
							<div class="flex gap-4">
								<!-- Vote Button -->
								<div class="flex flex-col items-center">
									<form
										method="POST"
										action="?/vote"
										use:enhance={() => {
											votingInProgress = request.id;
											return async ({ result, update }) => {
												votingInProgress = null;
												if (result.type === 'success') {
													// Optimistic update
													if (isVoted) {
														data.userVotedIds = data.userVotedIds.filter((id) => id !== request.id);
														request.vote_count = Math.max(0, (request.vote_count || 0) - 1);
													} else {
														data.userVotedIds = [...data.userVotedIds, request.id];
														request.vote_count = (request.vote_count || 0) + 1;
													}
												}
												update();
											};
										}}
									>
										<input type="hidden" name="featureRequestId" value={request.id} />
										<input type="hidden" name="action" value={isVoted ? 'remove' : 'add'} />
										<button
											type="submit"
											disabled={!data.user || votingInProgress === request.id}
											class="flex flex-col items-center gap-1 {isVoted
												? 'text-theme-primary'
												: 'text-theme-text-muted hover:text-theme-primary'} 
												{!data.user ? 'cursor-not-allowed opacity-50' : 'transition-colors'}
												{votingInProgress === request.id ? 'animate-pulse' : ''}"
											title={!data.user
												? 'Zum Abstimmen anmelden'
												: isVoted
													? 'Stimme zurücknehmen'
													: 'Abstimmen'}
										>
											<svg
												class="h-6 w-6 {isVoted ? 'fill-current' : ''}"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M5 15l7-7 7 7"
												/>
											</svg>
											<span class="text-lg font-semibold">{request.vote_count || 0}</span>
										</button>
									</form>
								</div>

								<!-- Content -->
								<div class="flex-1">
									<div class="flex items-start justify-between gap-4">
										<div>
											<h3 class="mb-2 text-lg font-semibold text-theme-text">
												{#if request.category}
													<span class="mr-2">{categoryIcon}</span>
												{/if}
												{request.message}
											</h3>
											{#if request.name}
												<p class="mb-2 text-sm text-theme-text-muted">
													Vorgeschlagen von {request.name}
												</p>
											{/if}
										</div>

										<div class="flex items-center gap-2">
											<span class="rounded-full px-3 py-1 text-xs font-medium {statusBadge.class}">
												{statusBadge.text}
											</span>
											{#if request.priority === 'critical'}
												<span
													class="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400"
												>
													🔴 Kritisch
												</span>
											{:else if request.priority === 'high'}
												<span
													class="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
												>
													🟠 Hoch
												</span>
											{/if}
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-12 text-center">
					<p class="text-theme-text-muted">
						Noch keine Community-Vorschläge vorhanden. Sei der Erste!
					</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Features Grid -->
	<div class="px-4 py-16">
		<div class="mx-auto max-w-7xl">
			{#each features as category}
				<div class="mb-16">
					<div class="mb-8 flex items-center gap-3">
						<span class="text-3xl">{category.icon}</span>
						<h2 class="text-3xl font-bold text-theme-text">{category.category}</h2>
					</div>
					<div
						class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
					>
						{#each category.items as item}
							{@const combinedText = `${item.title}. ${item.description}`}
							{@const firstSentenceEnd = combinedText.indexOf('.') + 1}
							{@const firstPart = combinedText.slice(0, firstSentenceEnd)}
							{@const secondPart = combinedText.slice(firstSentenceEnd).trim()}
							<div
								class="flex aspect-square transform flex-col items-start justify-start rounded-lg bg-theme-surface p-4 text-left transition-shadow duration-200 hover:scale-[1.02] hover:shadow-lg"
							>
								<span class="mb-3 text-2xl">{item.icon}</span>
								<p class="text-sm leading-relaxed text-theme-text">
									<span class="font-bold">{firstPart}</span>
									{#if secondPart}
										<span class="font-normal"> {secondPart}</span>
									{/if}
								</p>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Comparison Table -->
	<div class="bg-theme-surface/50 px-4 py-16">
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-12 text-center text-3xl font-bold text-theme-text">Free vs Pro Vergleich</h2>
			<div class="overflow-hidden rounded-xl bg-theme-surface shadow-lg">
				<div class="grid grid-cols-3 bg-theme-primary text-theme-background">
					<div class="p-4 font-semibold">Feature</div>
					<div class="p-4 text-center font-semibold">Free</div>
					<div class="p-4 text-center font-semibold">Pro</div>
				</div>
				{#each comparisons as item, index}
					<div
						class="grid grid-cols-3 {index % 2 === 0
							? 'bg-theme-background'
							: 'bg-theme-surface/50'}"
					>
						<div class="p-4 font-medium text-theme-text">{item.feature}</div>
						<div class="p-4 text-center text-theme-text-muted">
							{#if item.free === '✓'}
								<span class="text-green-500">✓</span>
							{:else if item.free === '✗'}
								<span class="text-red-500">✗</span>
							{:else}
								{item.free}
							{/if}
						</div>
						<div class="p-4 text-center text-theme-text">
							{#if item.pro === '✓'}
								<span class="font-bold text-green-500">✓</span>
							{:else}
								<span class="font-semibold text-theme-primary">{item.pro}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Stats Section -->
	<div class="px-4 py-16">
		<div class="mx-auto max-w-6xl">
			<h2 class="mb-12 text-center text-3xl font-bold text-theme-text">Warum ulo.ad?</h2>
			<div class="grid grid-cols-1 gap-8 md:grid-cols-4">
				<div class="text-center">
					<div class="mb-2 text-4xl font-bold text-theme-primary">99.9%</div>
					<div class="text-theme-text-muted">Uptime SLA</div>
				</div>
				<div class="text-center">
					<div class="mb-2 text-4xl font-bold text-theme-primary">~50ms</div>
					<div class="text-theme-text-muted">Avg. Response</div>
				</div>
				<div class="text-center">
					<div class="mb-2 text-4xl font-bold text-theme-primary">5</div>
					<div class="text-theme-text-muted">Sprachen</div>
				</div>
				<div class="text-center">
					<div class="mb-2 text-4xl font-bold text-theme-primary">24/7</div>
					<div class="text-theme-text-muted">Support</div>
				</div>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-gradient-to-r from-theme-primary/10 to-theme-primary/5 px-4 py-16">
		<div class="mx-auto max-w-4xl text-center">
			<h2 class="mb-6 text-3xl font-bold text-theme-text">Bereit durchzustarten?</h2>
			<p class="mb-8 text-xl text-theme-text-muted">
				Starte kostenlos mit 10 Links pro Monat oder wähle einen Pro Plan für unbegrenzte
				Möglichkeiten.
			</p>
			<div class="flex justify-center gap-4">
				<a
					href="/auth/register"
					class="rounded-lg bg-theme-primary px-8 py-4 text-lg font-medium text-theme-background transition-colors hover:bg-theme-primary-hover"
				>
					Kostenlos starten
				</a>
				<a
					href="/pricing"
					class="rounded-lg bg-theme-surface px-8 py-4 text-lg font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
				>
					Pro Features ansehen
				</a>
			</div>
			<p class="mt-6 text-sm text-theme-text-muted">
				Keine Kreditkarte erforderlich • Jederzeit kündbar • DSGVO-konform
			</p>
		</div>
	</div>

	<!-- Feature Request Form -->
	<div class="bg-theme-surface/50 px-4 py-16">
		<div class="mx-auto max-w-2xl">
			<div class="rounded-xl bg-theme-surface p-8 shadow-lg">
				<h2 class="mb-2 text-2xl font-bold text-theme-text">Feedback & Wünsche</h2>
				<p class="mb-6 text-theme-text-muted">
					Hast du eine Idee oder vermisst du eine Funktion? Lass es uns wissen!
				</p>

				{#if showSuccess}
					<div
						class="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20"
					>
						<p class="text-green-800 dark:text-green-300">Vielen Dank für dein Feedback! 🎉</p>
					</div>
				{/if}

				<form
					method="POST"
					action="?/requestFeature"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								showSuccess = true;
								// Clear the form
								const form = document.getElementById('feedback-form') as HTMLFormElement;
								if (form) form.reset();
								setTimeout(() => (showSuccess = false), 5000);
							}
						};
					}}
					id="feedback-form"
					class="space-y-4"
				>
					<div>
						<label for="message" class="mb-2 block text-sm font-medium text-theme-text">
							Deine Nachricht
						</label>
						<textarea
							id="message"
							name="message"
							required
							rows="5"
							class="w-full resize-none rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text focus:border-transparent focus:ring-2 focus:ring-theme-primary"
							placeholder="Erzähl uns von deiner Idee oder deinem Feature-Wunsch..."
						></textarea>
					</div>

					<details class="group">
						<summary
							class="cursor-pointer text-sm text-theme-text-muted transition-colors hover:text-theme-text"
						>
							Optional: Kontaktdaten hinterlassen
						</summary>
						<div class="mt-4 space-y-4">
							<div>
								<label for="name" class="mb-2 block text-sm font-medium text-theme-text">
									Name (optional)
								</label>
								<input
									type="text"
									id="name"
									name="name"
									class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text focus:border-transparent focus:ring-2 focus:ring-theme-primary"
									placeholder="Max Mustermann"
								/>
							</div>

							<div>
								<label for="email" class="mb-2 block text-sm font-medium text-theme-text">
									E-Mail (optional)
								</label>
								<input
									type="email"
									id="email"
									name="email"
									class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text focus:border-transparent focus:ring-2 focus:ring-theme-primary"
									placeholder="max@beispiel.de"
								/>
							</div>
						</div>
					</details>

					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full rounded-lg bg-theme-primary px-6 py-3 font-medium text-theme-background transition-colors hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
					</button>
				</form>
			</div>
		</div>
	</div>
</div>

<style>
	.bg-grid-pattern {
		background-image:
			linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
		background-size: 50px 50px;
	}
</style>
