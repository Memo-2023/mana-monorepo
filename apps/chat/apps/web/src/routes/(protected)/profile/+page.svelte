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

		<!-- Settings Card -->
		<div
			class="bg-surface rounded-xl border border-border shadow-sm overflow-hidden mb-6"
		>
			<div class="p-6">
				<h3 class="text-lg font-semibold text-foreground mb-4">Einstellungen</h3>

				<div class="space-y-4">
					<!-- Theme Toggle -->
					<div class="flex items-center justify-between py-3">
						<div>
							<p class="font-medium text-foreground">Dunkler Modus</p>
							<p class="text-sm text-muted-foreground">Aktiviere den dunklen Modus für die App</p>
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
