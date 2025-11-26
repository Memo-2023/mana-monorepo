<script lang="ts">
	let activeTab = $state<'creators' | 'teams' | 'business' | 'events'>('creators');
</script>

<section id="target-audience" class="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<h2 class="mb-4 text-3xl font-bold text-theme-text sm:text-4xl">
				Für jeden die richtige Lösung
			</h2>
			<p class="mx-auto mb-12 max-w-2xl text-lg text-theme-text-muted">
				Egal ob Creator, Team oder Unternehmen - wir haben die passenden Features für dich
			</p>
		</div>

		<!-- Tab Navigation -->
		<div class="mb-8 flex flex-wrap justify-center gap-2">
			<button
				onclick={() => activeTab = 'creators'}
				class="rounded-lg px-6 py-3 font-medium transition {activeTab === 'creators' 
					? 'bg-theme-primary text-white' 
					: 'bg-theme-surface text-theme-text hover:bg-theme-surface/80'}"
			>
				📱 Creators & Influencer
			</button>
			<button
				onclick={() => activeTab = 'teams'}
				class="rounded-lg px-6 py-3 font-medium transition {activeTab === 'teams' 
					? 'bg-theme-primary text-white' 
					: 'bg-theme-surface text-theme-text hover:bg-theme-surface/80'}"
			>
				💼 Teams & Agenturen
			</button>
			<button
				onclick={() => activeTab = 'business'}
				class="rounded-lg px-6 py-3 font-medium transition {activeTab === 'business' 
					? 'bg-theme-primary text-white' 
					: 'bg-theme-surface text-theme-text hover:bg-theme-surface/80'}"
			>
				🏢 KMU & Startups
			</button>
			<button
				onclick={() => activeTab = 'events'}
				class="rounded-lg px-6 py-3 font-medium transition {activeTab === 'events' 
					? 'bg-theme-primary text-white' 
					: 'bg-theme-surface text-theme-text hover:bg-theme-surface/80'}"
			>
				🎯 Events & Gastro
			</button>
		</div>

		<!-- Tab Content -->
		<div class="rounded-xl border border-theme-border bg-theme-surface p-8">
			{#if activeTab === 'creators'}
				<div class="grid gap-8 lg:grid-cols-2">
					<div>
						<h3 class="mb-4 text-2xl font-bold text-theme-text">
							Ein Link für alle deine Kanäle
						</h3>
						<p class="mb-6 text-theme-text-muted">
							Perfekt für Instagram, TikTok und YouTube. Erstelle beeindruckende Link-in-Bio Seiten,
							tracke deine Klicks und verstehe deine Audience besser.
						</p>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Anpassbare Profilseiten mit deinem Branding</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">QR-Codes für Offline-zu-Online Verbindung</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Detaillierte Analytics zu Klicks und Herkunft</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Social Media Icons und Integrationen</span>
							</li>
						</ul>
						<div class="mt-6">
							<a href="/register" class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition hover:bg-theme-primary-hover">
								Jetzt starten
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<div class="relative">
							<div class="absolute -inset-4 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 blur-xl"></div>
							<img 
								src="/images/creator-mockup.png" 
								alt="Creator Profile Preview" 
								class="relative rounded-xl shadow-2xl"
								onerror={() => {}}
							/>
							<!-- Fallback illustration if image doesn't exist -->
							<div class="relative flex h-96 w-80 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white">
								<div class="text-center">
									<div class="mb-4 text-6xl">📱</div>
									<p class="text-xl font-bold">Creator Profile</p>
									<p class="mt-2 text-sm opacity-90">Coming Soon</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'teams'}
				<div class="grid gap-8 lg:grid-cols-2">
					<div>
						<h3 class="mb-4 text-2xl font-bold text-theme-text">
							Gemeinsam mehr erreichen
						</h3>
						<p class="mb-6 text-theme-text-muted">
							Perfekte Kollaboration für Marketing-Teams und Agenturen. Verwaltet Links gemeinsam,
							teilt Analytics und arbeitet effizienter zusammen.
						</p>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Team-Workspaces mit granularen Berechtigungen</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Multi-Client Management für Agenturen</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Gemeinsame Analytics und Reporting</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Bulk-Operationen und CSV-Import</span>
							</li>
						</ul>
						<div class="mt-6">
							<a href="/register" class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition hover:bg-theme-primary-hover">
								Team Plan wählen
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<div class="relative flex h-96 w-80 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
							<div class="text-center">
								<div class="mb-4 text-6xl">💼</div>
								<p class="text-xl font-bold">Team Dashboard</p>
								<p class="mt-2 text-sm opacity-90">10 Mitglieder • Unbegrenzte Links</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'business'}
				<div class="grid gap-8 lg:grid-cols-2">
					<div>
						<h3 class="mb-4 text-2xl font-bold text-theme-text">
							Professionelles Link-Management
						</h3>
						<p class="mb-6 text-theme-text-muted">
							Die kostengünstige Alternative zu Enterprise-Lösungen. Perfekt für KMUs und Startups,
							die ihre digitale Präsenz professionell verwalten wollen.
						</p>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Custom Domains für deine Marke (coming soon)</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">API-Zugang für Automatisierung</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Erweiterte Analytics und Exporte</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">DSGVO-konform und hosted in Germany</span>
							</li>
						</ul>
						<div class="mt-6">
							<a href="/register" class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition hover:bg-theme-primary-hover">
								Business Plan starten
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<div class="relative flex h-96 w-80 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
							<div class="text-center">
								<div class="mb-4 text-6xl">🏢</div>
								<p class="text-xl font-bold">Enterprise Ready</p>
								<p class="mt-2 text-sm opacity-90">API • Custom Domain • SSO</p>
							</div>
						</div>
					</div>
				</div>
			{/if}

			{#if activeTab === 'events'}
				<div class="grid gap-8 lg:grid-cols-2">
					<div>
						<h3 class="mb-4 text-2xl font-bold text-theme-text">
							QR-Codes die funktionieren
						</h3>
						<p class="mb-6 text-theme-text-muted">
							Ideal für Restaurants, Events und Veranstaltungen. Erstelle QR-Codes für Speisekarten,
							Event-Infos oder zeitlich begrenzte Aktionen.
						</p>
						<ul class="space-y-3">
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">QR-Codes in verschiedenen Farben und Formaten</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Zeitlich begrenzte Links für Aktionen</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Passwortgeschützte Inhalte für VIPs</span>
							</li>
							<li class="flex items-start gap-3">
								<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								<span class="text-theme-text">Echtzeit-Updates ohne QR-Code Neudruck</span>
							</li>
						</ul>
						<div class="mt-6">
							<a href="/register" class="inline-flex items-center gap-2 rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition hover:bg-theme-primary-hover">
								QR-Codes erstellen
								<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</a>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<div class="relative flex h-96 w-80 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
							<div class="text-center">
								<div class="mb-4 text-6xl">🎯</div>
								<p class="text-xl font-bold">Event QR-Codes</p>
								<p class="mt-2 text-sm opacity-90">Dynamisch • Trackbar • Aktualisierbar</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>