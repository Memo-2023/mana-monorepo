<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from '../../../routes/$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let isSubmitting = $state(false);
	let inputUrl = $state('');
</script>

<section class="relative overflow-hidden bg-gradient-to-br from-theme-primary/5 via-theme-background to-purple-600/5 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
	<!-- Background decoration -->
	<div class="absolute inset-0 -z-10">
		<div class="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-theme-primary/10 blur-3xl"></div>
		<div class="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl"></div>
	</div>

	<div class="mx-auto max-w-7xl">
		<div class="text-center">
			<!-- Trust badges -->
			<div class="mb-6 flex flex-wrap justify-center gap-4 text-sm text-theme-text-muted">
				<span class="flex items-center gap-1">
					<svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
					DSGVO-konform
				</span>
				<span class="flex items-center gap-1">
					<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
					Blitzschnell
				</span>
				<span class="flex items-center gap-1">
					<svg class="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
					100% Sicher
				</span>
			</div>

			<!-- Main headline -->
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-theme-text sm:text-5xl lg:text-6xl">
				More than links.
				<span class="bg-gradient-to-r from-theme-primary to-purple-600 bg-clip-text text-transparent">
					Your digital identity.
				</span>
			</h1>

			<p class="mx-auto mb-8 max-w-2xl text-lg text-theme-text-muted sm:text-xl">
				Der einzige Link-Shortener mit integriertem Profile-Builder. 
				Erstelle kurze Links, beeindruckende Profilkarten und manage alles im Team.
			</p>

			<!-- CTA Buttons -->
			<div class="mb-12 flex flex-col justify-center gap-4 sm:flex-row">
				<a 
					href="#url-form"
					class="rounded-lg bg-theme-primary px-8 py-3 font-semibold text-white shadow-lg transition hover:bg-theme-primary-hover hover:shadow-xl"
				>
					Kostenlos starten →
				</a>
				<a 
					href="#features"
					class="rounded-lg border-2 border-theme-border bg-theme-surface px-8 py-3 font-semibold text-theme-text transition hover:border-theme-primary hover:shadow-lg"
				>
					Live Demo ansehen
				</a>
			</div>

			<!-- Quick demo form -->
			<div class="mx-auto max-w-2xl">
				<form
					method="POST"
					action="/?/create"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							await update();
							isSubmitting = false;
						};
					}}
					class="flex flex-col gap-3 rounded-xl border border-theme-border bg-theme-surface/80 p-4 backdrop-blur sm:flex-row sm:p-2"
				>
					<input
						type="url"
						name="url"
						required
						bind:value={inputUrl}
						placeholder="Deine lange URL hier einfügen..."
						class="flex-1 rounded-lg border-0 bg-transparent px-4 py-3 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 focus:ring-theme-primary sm:py-2"
					/>
					<button
						type="submit"
						disabled={isSubmitting || !inputUrl}
						class="rounded-lg bg-theme-primary px-6 py-3 font-medium text-white transition hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
					>
						{#if isSubmitting}
							<svg class="mx-auto h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						{:else}
							Kürzen →
						{/if}
					</button>
				</form>
				<p class="mt-2 text-sm text-theme-text-muted">
					Keine Anmeldung erforderlich • Kostenlos • QR-Code inklusive
				</p>
			</div>
		</div>

		<!-- Visual preview -->
		<div class="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
			<!-- Link shortening preview -->
			<div class="group relative rounded-xl border border-theme-border bg-theme-surface p-6 transition hover:shadow-xl">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-theme-primary/10">
					<svg class="h-6 w-6 text-theme-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
					</svg>
				</div>
				<h3 class="mb-2 font-semibold text-theme-text">Smart Links</h3>
				<p class="text-sm text-theme-text-muted">
					Kurze URLs mit Tracking, Ablaufdatum und Passwortschutz
				</p>
				<div class="mt-4 text-xs text-theme-primary group-hover:underline">
					Mehr erfahren →
				</div>
			</div>

			<!-- Profile cards preview -->
			<div class="group relative rounded-xl border border-theme-border bg-theme-surface p-6 transition hover:shadow-xl">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600/10">
					<svg class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
					</svg>
				</div>
				<h3 class="mb-2 font-semibold text-theme-text">Profile Cards</h3>
				<p class="text-sm text-theme-text-muted">
					Beeindruckende Profilseiten mit Drag & Drop Builder
				</p>
				<div class="mt-4 text-xs text-purple-600 group-hover:underline">
					Templates ansehen →
				</div>
			</div>

			<!-- Team collaboration preview -->
			<div class="group relative rounded-xl border border-theme-border bg-theme-surface p-6 transition hover:shadow-xl">
				<div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-600/10">
					<svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<h3 class="mb-2 font-semibold text-theme-text">Team Workspace</h3>
				<p class="text-sm text-theme-text-muted">
					Gemeinsam Links verwalten mit granularen Berechtigungen
				</p>
				<div class="mt-4 text-xs text-green-600 group-hover:underline">
					Für Teams →
				</div>
			</div>
		</div>
	</div>
</section>