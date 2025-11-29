<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';

	function handleSignOut() {
		authStore.signOut();
		goto('/login');
	}

	function toggleTheme() {
		theme.toggleMode();
	}

	function formatDate(dateString: string | undefined): string {
		if (!dateString) return '-';
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Profil | ManaChat</title>
</svelte:head>

<div class="min-h-[calc(100vh-4rem)] bg-background py-8">
	<div class="max-w-2xl mx-auto px-4">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-2xl font-bold text-foreground">Profil</h1>
			<p class="text-sm text-muted-foreground mt-1">
				Verwalte dein Konto und deine Einstellungen.
			</p>
		</div>

		<!-- Profile Card -->
		<div
			class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mb-6"
		>
			<div class="p-6">
				<div class="flex items-center gap-4 mb-6">
					<div
						class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
					>
						<svg
							class="w-8 h-8 text-primary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-semibold text-foreground">
							{authStore.user?.email || 'Benutzer'}
						</h2>
						<p class="text-sm text-muted-foreground">
							Mitglied seit {formatDate(authStore.user?.created_at)}
						</p>
					</div>
				</div>

				<div class="space-y-4">
					<div
						class="flex items-center justify-between py-3 border-b border-border"
					>
						<div>
							<p class="font-medium text-foreground">E-Mail</p>
							<p class="text-sm text-muted-foreground">{authStore.user?.email || '-'}</p>
						</div>
					</div>
					<div
						class="flex items-center justify-between py-3 border-b border-border"
					>
						<div>
							<p class="font-medium text-foreground">Benutzer-ID</p>
							<p class="text-sm text-muted-foreground font-mono">{authStore.user?.id || '-'}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Quick Actions Card -->
		<div
			class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mb-6"
		>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-foreground mb-4">Schnellzugriff</h3>

				<div class="space-y-4">
					<!-- Settings Link -->
					<a
						href="/settings"
						class="flex items-center justify-between py-3 border-b border-border hover:bg-muted/50 -mx-6 px-6 transition-colors"
					>
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<div>
								<p class="font-medium text-foreground">Einstellungen</p>
								<p class="text-sm text-muted-foreground">Erscheinungsbild, Benachrichtigungen & mehr</p>
							</div>
						</div>
						<svg class="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>

					<!-- Theme Toggle -->
					<div class="flex items-center justify-between py-3">
						<div class="flex items-center gap-3">
							<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
								/>
							</svg>
							<div>
								<p class="font-medium text-foreground">Dunkler Modus</p>
								<p class="text-sm text-muted-foreground">Schnell umschalten</p>
							</div>
						</div>
						<button
							onclick={toggleTheme}
							class="relative w-12 h-6 rounded-full transition-colors
                     {theme.mode === 'dark' ? 'bg-primary' : 'bg-muted'}"
							role="switch"
							aria-checked={theme.mode === 'dark'}
							aria-label="Dunkler Modus umschalten"
						>
							<span
								class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform
                       {theme.mode === 'dark' ? 'translate-x-6' : 'translate-x-0'}"
							></span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Sign Out -->
		<div
			class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden"
		>
			<div class="p-6">
				<button
					onclick={handleSignOut}
					class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-destructive/10
                 text-destructive rounded-lg font-medium
                 hover:bg-destructive/20 transition-colors"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						/>
					</svg>
					Abmelden
				</button>
			</div>
		</div>
	</div>
</div>
