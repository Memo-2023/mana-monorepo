<script lang="ts">
	import { onMount } from 'svelte';

	let selectedFeature = $state<'links' | 'cards' | 'analytics' | 'qr' | 'team' | 'templates'>(
		'links'
	);
	let animationKey = $state(0);

	$effect(() => {
		// Trigger re-animation when feature changes
		animationKey++;
	});
</script>

<section id="features" class="bg-theme-surface/50 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<h2 class="mb-4 text-3xl font-bold text-theme-text sm:text-4xl">
				Alle Features die du brauchst
			</h2>
			<p class="mx-auto mb-12 max-w-2xl text-lg text-theme-text-muted">
				Von Link-Verkürzung bis Team-Kollaboration - alles in einer Plattform vereint
			</p>
		</div>

		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Feature Navigation -->
			<div class="space-y-2">
				<button
					onclick={() => (selectedFeature = 'links')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'links'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature ===
						'links'
							? 'bg-white/20'
							: 'bg-theme-primary/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'links' ? 'text-white' : 'text-theme-primary'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							class="font-semibold {selectedFeature === 'links' ? 'text-white' : 'text-theme-text'}"
						>
							Smart Link Management
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'links'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							Kurze URLs mit erweiterten Features
						</p>
					</div>
				</button>

				<button
					onclick={() => (selectedFeature = 'cards')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'cards'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature ===
						'cards'
							? 'bg-white/20'
							: 'bg-purple-600/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'cards' ? 'text-white' : 'text-purple-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							class="font-semibold {selectedFeature === 'cards' ? 'text-white' : 'text-theme-text'}"
						>
							Profilkarten Builder
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'cards'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							3-Stufen Builder mit Live-Preview
						</p>
					</div>
				</button>

				<button
					onclick={() => (selectedFeature = 'analytics')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'analytics'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature ===
						'analytics'
							? 'bg-white/20'
							: 'bg-blue-600/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'analytics' ? 'text-white' : 'text-blue-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							class="font-semibold {selectedFeature === 'analytics'
								? 'text-white'
								: 'text-theme-text'}"
						>
							Professionelle Analytics
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'analytics'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							Echtzeit-Tracking und Insights
						</p>
					</div>
				</button>

				<button
					onclick={() => (selectedFeature = 'qr')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'qr'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature === 'qr'
							? 'bg-white/20'
							: 'bg-green-600/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'qr' ? 'text-white' : 'text-green-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3 class="font-semibold {selectedFeature === 'qr' ? 'text-white' : 'text-theme-text'}">
							QR-Code Generator
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'qr'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							Anpassbare Designs und Farben
						</p>
					</div>
				</button>

				<button
					onclick={() => (selectedFeature = 'team')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'team'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature === 'team'
							? 'bg-white/20'
							: 'bg-indigo-600/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'team' ? 'text-white' : 'text-indigo-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							class="font-semibold {selectedFeature === 'team' ? 'text-white' : 'text-theme-text'}"
						>
							Team Kollaboration
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'team'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							Workspaces und Berechtigungen
						</p>
					</div>
				</button>

				<button
					onclick={() => (selectedFeature = 'templates')}
					class="group flex w-full items-center gap-4 rounded-lg px-6 py-4 text-left transition {selectedFeature ===
					'templates'
						? 'bg-theme-primary text-white shadow-lg'
						: 'hover:bg-theme-surface/80 bg-theme-surface text-theme-text'}"
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg {selectedFeature ===
						'templates'
							? 'bg-white/20'
							: 'bg-pink-600/10'}"
					>
						<svg
							class="h-6 w-6 {selectedFeature === 'templates' ? 'text-white' : 'text-pink-600'}"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							class="font-semibold {selectedFeature === 'templates'
								? 'text-white'
								: 'text-theme-text'}"
						>
							Template Store
						</h3>
						<p
							class="mt-1 text-sm {selectedFeature === 'templates'
								? 'text-white/80'
								: 'text-theme-text-muted'}"
						>
							Vorgefertigte Designs und Layouts
						</p>
					</div>
				</button>
			</div>

			<!-- Feature Preview -->
			<div class="flex items-center justify-center">
				<div key={animationKey} class="animate-fade-in relative w-full max-w-md">
					{#if selectedFeature === 'links'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">Smart Link Features</h4>
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Custom Short Codes</span>
								</div>
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Ablaufdatum festlegen</span>
								</div>
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Click-Limits definieren</span>
								</div>
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Passwortschutz aktivieren</span>
								</div>
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Tags zur Organisation</span>
								</div>
								<div class="flex items-center gap-3">
									<div class="h-2 w-2 rounded-full bg-green-500"></div>
									<span class="text-sm text-theme-text">Bulk-Operationen</span>
								</div>
							</div>
							<div class="bg-theme-primary/10 mt-6 rounded-lg p-3">
								<p class="text-xs text-theme-primary">
									Beispiel: ulo.ad/produkt-launch → 500 Clicks, läuft in 7 Tagen ab
								</p>
							</div>
						</div>
					{/if}

					{#if selectedFeature === 'cards'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">3-Stufen Builder</h4>
							<div class="space-y-4">
								<div
									class="rounded-lg border border-green-500 bg-green-50 p-3 dark:bg-green-900/20"
								>
									<p class="font-medium text-green-700 dark:text-green-400">👶 Anfänger</p>
									<p class="mt-1 text-sm text-green-600 dark:text-green-300">
										Einfache Vorlagen, schnell anpassbar
									</p>
								</div>
								<div class="rounded-lg border border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
									<p class="font-medium text-blue-700 dark:text-blue-400">💪 Fortgeschritten</p>
									<p class="mt-1 text-sm text-blue-600 dark:text-blue-300">
										Drag & Drop Module, mehr Kontrolle
									</p>
								</div>
								<div
									class="rounded-lg border border-purple-500 bg-purple-50 p-3 dark:bg-purple-900/20"
								>
									<p class="font-medium text-purple-700 dark:text-purple-400">🚀 Experte</p>
									<p class="mt-1 text-sm text-purple-600 dark:text-purple-300">
										Volle Freiheit, eigener Code möglich
									</p>
								</div>
							</div>
						</div>
					{/if}

					{#if selectedFeature === 'analytics'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">Analytics Dashboard</h4>
							<div class="space-y-4">
								<!-- Mini chart visualization -->
								<div class="flex items-end gap-2">
									<div class="bg-theme-primary/20 h-16 w-8 rounded"></div>
									<div class="bg-theme-primary/40 h-24 w-8 rounded"></div>
									<div class="bg-theme-primary/60 h-32 w-8 rounded"></div>
									<div class="bg-theme-primary/80 h-28 w-8 rounded"></div>
									<div class="h-36 w-8 rounded bg-theme-primary"></div>
									<div class="h-30 bg-theme-primary/90 w-8 rounded"></div>
									<div class="h-26 bg-theme-primary/70 w-8 rounded"></div>
								</div>
								<div class="grid grid-cols-2 gap-4">
									<div class="rounded-lg bg-theme-surface p-3">
										<p class="text-xs text-theme-text-muted">Total Clicks</p>
										<p class="text-2xl font-bold text-theme-text">24.5k</p>
									</div>
									<div class="rounded-lg bg-theme-surface p-3">
										<p class="text-xs text-theme-text-muted">CTR</p>
										<p class="text-2xl font-bold text-theme-text">3.2%</p>
									</div>
								</div>
								<div class="space-y-2">
									<p class="text-xs font-medium text-theme-text-muted">Top Referrer</p>
									<div class="flex items-center justify-between text-sm">
										<span class="text-theme-text">Instagram</span>
										<span class="text-theme-primary">45%</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-theme-text">Twitter</span>
										<span class="text-theme-primary">28%</span>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-theme-text">Direct</span>
										<span class="text-theme-primary">27%</span>
									</div>
								</div>
							</div>
						</div>
					{/if}

					{#if selectedFeature === 'qr'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">QR-Code Optionen</h4>
							<div class="flex justify-center">
								<div class="grid grid-cols-3 gap-4">
									<div class="text-center">
										<div
											class="mb-2 flex h-24 w-24 items-center justify-center rounded-lg bg-white p-2"
										>
											<div class="h-full w-full rounded bg-black"></div>
										</div>
										<p class="text-xs text-theme-text">Schwarz</p>
									</div>
									<div class="text-center">
										<div
											class="mb-2 flex h-24 w-24 items-center justify-center rounded-lg bg-black p-2"
										>
											<div class="h-full w-full rounded bg-white"></div>
										</div>
										<p class="text-xs text-theme-text">Weiß</p>
									</div>
									<div class="text-center">
										<div
											class="mb-2 flex h-24 w-24 items-center justify-center rounded-lg bg-white p-2"
										>
											<div class="h-full w-full rounded bg-yellow-500"></div>
										</div>
										<p class="text-xs text-theme-text">Gold</p>
									</div>
								</div>
							</div>
							<div class="mt-4 space-y-2">
								<p class="text-sm font-medium text-theme-text">Formate:</p>
								<div class="flex gap-2">
									<span class="bg-theme-primary/10 rounded px-2 py-1 text-xs text-theme-primary"
										>PNG</span
									>
									<span class="bg-theme-primary/10 rounded px-2 py-1 text-xs text-theme-primary"
										>SVG</span
									>
									<span class="bg-theme-primary/10 rounded px-2 py-1 text-xs text-theme-primary"
										>JPG</span
									>
								</div>
							</div>
						</div>
					{/if}

					{#if selectedFeature === 'team'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">Team Workspace</h4>
							<div class="space-y-3">
								<div class="flex items-center justify-between rounded-lg bg-theme-surface p-3">
									<div class="flex items-center gap-3">
										<div class="bg-theme-primary/20 h-8 w-8 rounded-full"></div>
										<div>
											<p class="text-sm font-medium text-theme-text">Max Mustermann</p>
											<p class="text-xs text-theme-text-muted">Admin</p>
										</div>
									</div>
									<span
										class="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400"
										>Full Access</span
									>
								</div>
								<div class="flex items-center justify-between rounded-lg bg-theme-surface p-3">
									<div class="flex items-center gap-3">
										<div class="h-8 w-8 rounded-full bg-blue-500/20"></div>
										<div>
											<p class="text-sm font-medium text-theme-text">Anna Schmidt</p>
											<p class="text-xs text-theme-text-muted">Editor</p>
										</div>
									</div>
									<span
										class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
										>Edit Links</span
									>
								</div>
								<div class="flex items-center justify-between rounded-lg bg-theme-surface p-3">
									<div class="flex items-center gap-3">
										<div class="h-8 w-8 rounded-full bg-purple-500/20"></div>
										<div>
											<p class="text-sm font-medium text-theme-text">Tom Weber</p>
											<p class="text-xs text-theme-text-muted">Viewer</p>
										</div>
									</div>
									<span
										class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
										>View Only</span
									>
								</div>
							</div>
						</div>
					{/if}

					{#if selectedFeature === 'templates'}
						<div class="rounded-xl border border-theme-border bg-theme-surface p-6 shadow-xl">
							<h4 class="mb-4 text-lg font-semibold text-theme-text">Template Gallery</h4>
							<div class="grid grid-cols-2 gap-3">
								<div
									class="rounded-lg border border-theme-border bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-4"
								>
									<p class="mb-2 text-xs font-medium text-theme-text">Creator Pro</p>
									<div class="h-20 rounded bg-white/50"></div>
								</div>
								<div
									class="rounded-lg border border-theme-border bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4"
								>
									<p class="mb-2 text-xs font-medium text-theme-text">Business</p>
									<div class="h-20 rounded bg-white/50"></div>
								</div>
								<div
									class="rounded-lg border border-theme-border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4"
								>
									<p class="mb-2 text-xs font-medium text-theme-text">Restaurant</p>
									<div class="h-20 rounded bg-white/50"></div>
								</div>
								<div
									class="rounded-lg border border-theme-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4"
								>
									<p class="mb-2 text-xs font-medium text-theme-text">Portfolio</p>
									<div class="h-20 rounded bg-white/50"></div>
								</div>
							</div>
							<button
								class="bg-theme-primary/10 hover:bg-theme-primary/20 mt-4 w-full rounded-lg py-2 text-sm font-medium text-theme-primary"
							>
								Alle Templates ansehen →
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>
