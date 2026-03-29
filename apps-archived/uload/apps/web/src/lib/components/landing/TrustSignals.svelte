<script lang="ts">
	const trustBadges = [
		{
			icon: '🔒',
			title: 'SSL-verschlüsselt',
			description: 'Alle Daten werden sicher übertragen',
		},
		{
			icon: '🇩🇪',
			title: 'Hosted in Germany',
			description: 'Server in deutschen Rechenzentren',
		},
		{
			icon: '🛡️',
			title: 'DSGVO-konform',
			description: 'Vollständig GDPR-compliant',
		},
		{
			icon: '⚡',
			title: '99.9% Uptime',
			description: 'Garantierte Verfügbarkeit',
		},
	];

	const securityFeatures = [
		{
			title: 'Datenschutz First',
			items: [
				'Keine Weitergabe an Dritte',
				'Verschlüsselte Datenbanken',
				'Regelmäßige Sicherheits-Audits',
				'HTTPS für alle Links',
			],
		},
		{
			title: 'Zuverlässigkeit',
			items: [
				'Redundante Server-Infrastruktur',
				'Automatische Backups',
				'DDoS-Schutz',
				'24/7 Monitoring',
			],
		},
		{
			title: 'Compliance',
			items: [
				'DSGVO/GDPR konform',
				'Cookie-Richtlinien',
				'Recht auf Löschung',
				'Datenportabilität',
			],
		},
	];
</script>

<section id="trust" class="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<div class="mx-auto max-w-7xl">
		<!-- Trust Badges -->
		<div class="mb-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
			{#each trustBadges as badge}
				<div
					class="group rounded-xl border border-theme-border bg-theme-surface p-6 text-center transition hover:shadow-lg"
				>
					<div class="mb-3 text-4xl">{badge.icon}</div>
					<h3 class="mb-1 font-semibold text-theme-text">{badge.title}</h3>
					<p class="text-sm text-theme-text-muted">{badge.description}</p>
				</div>
			{/each}
		</div>

		<!-- Security Features -->
		<div
			class="to-theme-primary/5 rounded-xl border border-theme-border bg-gradient-to-br from-theme-surface p-8"
		>
			<div class="mb-8 text-center">
				<h2 class="mb-4 text-3xl font-bold text-theme-text">
					Sicherheit und Datenschutz an erster Stelle
				</h2>
				<p class="mx-auto max-w-2xl text-lg text-theme-text-muted">
					Wir nehmen den Schutz deiner Daten ernst. Deshalb setzen wir auf höchste
					Sicherheitsstandards.
				</p>
			</div>

			<div class="grid gap-8 lg:grid-cols-3">
				{#each securityFeatures as feature}
					<div>
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-theme-text">
							<svg
								class="h-5 w-5 text-green-500"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
								/>
							</svg>
							{feature.title}
						</h3>
						<ul class="space-y-2">
							{#each feature.items as item}
								<li class="flex items-start gap-2">
									<svg
										class="mt-0.5 h-4 w-4 flex-shrink-0 text-theme-primary"
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
									<span class="text-sm text-theme-text-muted">{item}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>

		<!-- Infrastructure Info -->
		<div class="mt-12 grid gap-6 lg:grid-cols-2">
			<div class="rounded-xl border border-theme-border bg-theme-surface p-6">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
						<svg
							class="h-6 w-6 text-blue-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-theme-text">Premium Infrastructure</h3>
						<p class="text-sm text-theme-text-muted">Hetzner Cloud Servers</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-theme-text-muted">
					Unsere Server laufen auf modernster Hetzner-Infrastruktur in deutschen Rechenzentren. Mit
					automatischer Skalierung und Load Balancing gewährleisten wir beste Performance.
				</p>
				<div class="flex flex-wrap gap-2">
					<span
						class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
					>
						Frankfurt
					</span>
					<span
						class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
					>
						Nürnberg
					</span>
					<span
						class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
					>
						Falkenstein
					</span>
				</div>
			</div>

			<div class="rounded-xl border border-theme-border bg-theme-surface p-6">
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
						<svg
							class="h-6 w-6 text-green-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-theme-text">Status & Monitoring</h3>
						<p class="text-sm text-theme-text-muted">Transparente Verfügbarkeit</p>
					</div>
				</div>
				<p class="mb-4 text-sm text-theme-text-muted">
					Wir überwachen unsere Systeme 24/7 und informieren proaktiv über Wartungen. Unser
					öffentliches Status-Dashboard zeigt die aktuelle Verfügbarkeit aller Services.
				</p>
				<a
					href="https://status.ulo.ad"
					class="inline-flex items-center gap-2 text-sm text-theme-primary hover:underline"
				>
					Status-Seite besuchen
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
						/>
					</svg>
				</a>
			</div>
		</div>

		<!-- Certifications -->
		<div class="bg-theme-surface/50 mt-12 rounded-xl border border-theme-border p-8">
			<h3 class="mb-6 text-center text-xl font-semibold text-theme-text">
				Zertifizierungen & Standards
			</h3>
			<div class="flex flex-wrap justify-center gap-8">
				<div class="flex flex-col items-center">
					<div class="mb-2 text-3xl">🔐</div>
					<span class="text-sm font-medium text-theme-text">SSL/TLS</span>
					<span class="text-xs text-theme-text-muted">Let's Encrypt</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="mb-2 text-3xl">📋</div>
					<span class="text-sm font-medium text-theme-text">DSGVO</span>
					<span class="text-xs text-theme-text-muted">EU Compliant</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="mb-2 text-3xl">🛡️</div>
					<span class="text-sm font-medium text-theme-text">ISO 27001</span>
					<span class="text-xs text-theme-text-muted">In Progress</span>
				</div>
				<div class="flex flex-col items-center">
					<div class="mb-2 text-3xl">✅</div>
					<span class="text-sm font-medium text-theme-text">PCI DSS</span>
					<span class="text-xs text-theme-text-muted">Level 1</span>
				</div>
			</div>
		</div>

		<!-- Support Info -->
		<div class="mt-12 text-center">
			<h3 class="mb-4 text-xl font-semibold text-theme-text">Fragen zur Sicherheit?</h3>
			<p class="mb-6 text-theme-text-muted">
				Unser Security-Team beantwortet gerne alle deine Fragen zum Datenschutz und zur Sicherheit.
			</p>
			<a
				href="mailto:security@ulo.ad"
				class="bg-theme-primary/10 inline-flex items-center gap-2 rounded-lg border-2 border-theme-primary px-6 py-3 font-medium text-theme-primary transition hover:bg-theme-primary hover:text-white"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
				security@ulo.ad
			</a>
		</div>
	</div>
</section>
