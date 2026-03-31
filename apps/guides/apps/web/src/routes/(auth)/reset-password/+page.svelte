<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let loading = $state(false);
	let hasToken = $state(false);
	let token = $state<string | null>(null);
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(() => {
		token = $page.url.searchParams.get('token');
		hasToken = !!token;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		if (!token) { error = 'Ungültiger Link'; return; }
		if (password !== confirmPassword) { error = 'Passwörter stimmen nicht überein'; return; }
		if (password.length < 8) { error = 'Mindestens 8 Zeichen'; return; }
		loading = true;
		try {
			const result = await authStore.resetPasswordWithToken(token, password);
			if (!result.success) error = result.error || 'Fehler beim Zurücksetzen';
			else { success = true; setTimeout(() => goto('/login'), 3000); }
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unbekannter Fehler';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Passwort zurücksetzen | Guides</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gradient-to-b from-teal-50 to-white dark:from-teal-950 dark:to-neutral-900">
	<header class="p-4">
		<a href="/" class="text-xl font-semibold text-teal-600">📖 Guides</a>
	</header>

	<main class="flex flex-1 items-center justify-center p-4">
		<div class="w-full max-w-md">
			<h1 class="mb-8 text-center text-2xl font-bold text-foreground">Passwort zurücksetzen</h1>

			{#if success}
				<div class="rounded-2xl bg-surface p-8 text-center shadow-lg">
					<div class="mb-4 text-5xl">✅</div>
					<p class="mb-6 text-sm text-muted-foreground">Passwort erfolgreich geändert. Du wirst weitergeleitet...</p>
					<a href="/login" class="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white">Zum Login</a>
				</div>
			{:else if hasToken}
				<div class="rounded-2xl bg-surface p-8 shadow-lg">
					<form onsubmit={handleSubmit} class="space-y-4">
						{#if error}
							<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
						{/if}
						<div>
							<label class="mb-1 block text-sm font-medium text-foreground">Neues Passwort</label>
							<input type="password" bind:value={password} required minlength={8} autocomplete="new-password"
								class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
						</div>
						<div>
							<label class="mb-1 block text-sm font-medium text-foreground">Passwort bestätigen</label>
							<input type="password" bind:value={confirmPassword} required minlength={8} autocomplete="new-password"
								class="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
						</div>
						<button type="submit" disabled={loading}
							class="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
							{loading ? 'Wird gespeichert...' : 'Passwort ändern'}
						</button>
					</form>
				</div>
			{:else}
				<div class="rounded-2xl bg-surface p-8 text-center shadow-lg">
					<div class="mb-4 text-5xl">⚠️</div>
					<p class="mb-6 text-sm text-muted-foreground">Dieser Link ist ungültig oder abgelaufen.</p>
					<a href="/forgot-password" class="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white">
						Neuen Link anfordern
					</a>
				</div>
			{/if}
		</div>
	</main>
</div>
