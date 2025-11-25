<script lang="ts">
	import Navigation from '$lib/components/Navigation.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const features = [
		{
			icon: '🔗',
			title: 'URL-Verkürzung',
			description: 'Verwandeln Sie lange URLs in kurze, teilbare Links mit nur einem Klick.'
		},
		{
			icon: '📊',
			title: 'Detaillierte Analytics',
			description: 'Verfolgen Sie Klicks, Herkunft und Engagement Ihrer Links in Echtzeit.'
		},
		{
			icon: '💳',
			title: 'Digitale Visitenkarten',
			description: 'Erstellen Sie professionelle digitale Visitenkarten mit QR-Codes.'
		},
		{
			icon: '🎨',
			title: 'Anpassbare Templates',
			description: 'Nutzen Sie vorgefertigte Templates oder erstellen Sie eigene Designs.'
		},
		{
			icon: '🔒',
			title: 'Passwortschutz',
			description: 'Schützen Sie Ihre Links mit Passwörtern und Ablaufdaten.'
		},
		{
			icon: '🏷️',
			title: 'Tag-System',
			description: 'Organisieren Sie Ihre Links mit Tags für bessere Übersicht.'
		}
	];

	const stats = [
		{ value: '10K+', label: 'Aktive Nutzer' },
		{ value: '500K+', label: 'Erstellte Links' },
		{ value: '2M+', label: 'Klicks verfolgt' },
		{ value: '99.9%', label: 'Uptime' }
	];

	const team = [
		{
			name: 'Till Schneider',
			role: 'Gründer & Entwickler',
			description: 'Full-Stack Entwickler mit Leidenschaft für saubere, effiziente Lösungen.',
			avatar: '👨‍💻'
		}
	];
</script>

<svelte:head>
	<title>{data.title || 'Über Uload'}</title>
	<meta name="description" content={data.description || 'Erfahren Sie mehr über Uload'} />
</svelte:head>

<div class="min-h-screen bg-theme-background">
	<Navigation user={data.user} />

	<!-- Hero Section -->
	<section class="relative overflow-hidden border-b border-theme-border bg-theme-surface">
		<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
		<div class="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tight text-theme-text sm:text-5xl md:text-6xl">
					Über <span class="text-theme-primary">Uload</span>
				</h1>
				<p class="mx-auto mt-6 max-w-2xl text-lg text-theme-text-muted">
					Ihre moderne Plattform für professionelles Link-Management und digitale Präsenz
				</p>
			</div>
		</div>
	</section>

	<!-- Mission Section -->
	<section class="bg-theme-background py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="text-3xl font-bold text-theme-text">Unsere Mission</h2>
				<p class="mt-6 text-lg leading-relaxed text-theme-text-muted">
					Bei Uload glauben wir daran, dass Link-Management einfach, effizient und zugänglich sein sollte. 
					Unsere Plattform wurde entwickelt, um Unternehmen und Einzelpersonen dabei zu helfen, 
					ihre Online-Präsenz zu optimieren und wertvolle Einblicke in ihr Publikum zu gewinnen.
				</p>
				<p class="mt-4 text-lg leading-relaxed text-theme-text-muted">
					Von der einfachen URL-Verkürzung bis hin zu erweiterten Analytics und digitalen Visitenkarten - 
					wir bieten alle Tools, die Sie für erfolgreiches digitales Marketing benötigen.
				</p>
			</div>
		</div>
	</section>

	<!-- Features Grid -->
	<section class="bg-theme-surface py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-theme-text">Was macht uns besonders?</h2>
				<p class="mt-4 text-lg text-theme-text-muted">
					Entdecken Sie die Features, die Uload zur ersten Wahl für Link-Management machen
				</p>
			</div>

			<div class="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
				{#each features as feature}
					<div class="group rounded-lg border border-theme-border bg-theme-surface-hover p-6 transition-all hover:shadow-md hover:scale-105">
						<div class="mb-4 text-4xl">{feature.icon}</div>
						<h3 class="mb-2 text-xl font-semibold text-theme-text">
							{feature.title}
						</h3>
						<p class="text-theme-text-muted">
							{feature.description}
						</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="bg-theme-primary py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-white">Uload in Zahlen</h2>
				<p class="mt-4 text-lg text-gray-200">
					Vertrauen Sie auf eine bewährte Plattform
				</p>
			</div>

			<div class="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
				{#each stats as stat}
					<div class="text-center">
						<div class="text-4xl font-bold text-white">{stat.value}</div>
						<div class="mt-2 text-sm text-gray-200">{stat.label}</div>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Team Section -->
	<section class="bg-theme-background py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-theme-text">Das Team</h2>
				<p class="mt-4 text-lg text-theme-text-muted">
					Die Menschen hinter Uload
				</p>
			</div>

			<div class="mt-12 flex justify-center">
				{#each team as member}
					<div class="max-w-sm rounded-lg border border-theme-border bg-theme-surface p-8 text-center shadow-lg">
						<div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-theme-surface-hover text-5xl">
							{member.avatar}
						</div>
						<h3 class="text-xl font-semibold text-theme-text">{member.name}</h3>
						<p class="mt-1 text-sm text-theme-accent">{member.role}</p>
						<p class="mt-4 text-theme-text-muted">{member.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Values Section -->
	<section class="bg-theme-surface py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-theme-text">Unsere Werte</h2>
			</div>

			<div class="mt-12 grid gap-8 md:grid-cols-3">
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-theme-surface-hover border border-theme-border text-2xl">
						🚀
					</div>
					<h3 class="mb-2 text-xl font-semibold text-theme-text">Innovation</h3>
					<p class="text-theme-text-muted">
						Wir entwickeln ständig neue Features und verbessern bestehende Funktionen.
					</p>
				</div>

				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-theme-surface-hover border border-theme-border text-2xl">
						🛡️
					</div>
					<h3 class="mb-2 text-xl font-semibold text-theme-text">Sicherheit</h3>
					<p class="text-theme-text-muted">
						Ihre Daten sind bei uns sicher. Datenschutz und Sicherheit haben höchste Priorität.
					</p>
				</div>

				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-theme-surface-hover border border-theme-border text-2xl">
						💡
					</div>
					<h3 class="mb-2 text-xl font-semibold text-theme-text">Einfachheit</h3>
					<p class="text-theme-text-muted">
						Komplexe Funktionen, einfach zu bedienen. Das ist unser Versprechen.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-theme-background py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="rounded-2xl bg-theme-primary px-8 py-12 text-center shadow-xl">
				<h2 class="text-3xl font-bold text-white">Bereit loszulegen?</h2>
				<p class="mt-4 text-lg text-gray-200">
					Erstellen Sie noch heute Ihr kostenloses Konto und entdecken Sie die Möglichkeiten
				</p>
				<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a
						href="/register"
						class="rounded-lg bg-white px-8 py-3 font-semibold text-theme-primary transition hover:bg-gray-50 hover:scale-105"
					>
						Kostenlos starten
					</a>
					<a
						href="/features"
						class="rounded-lg border-2 border-white px-8 py-3 font-semibold text-white transition hover:bg-white/10 hover:scale-105"
					>
						Features entdecken
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- Contact Section -->
	<section class="bg-theme-surface py-16">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="text-3xl font-bold text-theme-text">Kontakt</h2>
				<p class="mt-4 text-lg text-theme-text-muted">
					Haben Sie Fragen oder Feedback? Wir freuen uns von Ihnen zu hören!
				</p>
				<div class="mt-8 flex flex-col items-center gap-4">
					<a
						href="mailto:support@ulo.ad"
						class="flex items-center gap-2 text-theme-accent hover:text-theme-accent-hover transition-colors"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
						support@ulo.ad
					</a>
					<a
						href="/features"
						class="flex items-center gap-2 text-theme-accent hover:text-theme-accent-hover transition-colors"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
							/>
						</svg>
						Feature-Wünsche einreichen
					</a>
				</div>
			</div>
		</div>
	</section>

	<Footer />
</div>

<style>
	.bg-grid-pattern {
		background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
	}
</style>