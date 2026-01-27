<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';

	// Read verification status from query params (set after email verification)
	const verified = $derived($page.url.searchParams.get('verified') === 'true');
	const initialEmailFromUrl = $derived($page.url.searchParams.get('email') || '');

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let showVerifiedBanner = $state(false);

	// Initialize email from URL if provided
	$effect(() => {
		if (initialEmailFromUrl && !email) {
			email = initialEmailFromUrl;
		}
		if (verified) {
			showVerifiedBanner = true;
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		const result = await authStore.signIn(email, password);

		if (result.success) {
			goto('/dashboard');
		} else {
			error = result.error || 'Login fehlgeschlagen';
		}

		loading = false;
	}

	function dismissBanner() {
		showVerifiedBanner = false;
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	{#if showVerifiedBanner}
		<div
			class="relative rounded-md bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200"
		>
			<button
				type="button"
				onclick={dismissBanner}
				class="absolute right-2 top-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
			>
				×
			</button>
			E-Mail erfolgreich bestätigt! Du kannst dich jetzt anmelden.
		</div>
	{/if}

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	<div>
		<label for="email" class="block text-sm font-medium text-foreground">E-Mail</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			required
			class="input mt-1 w-full"
			placeholder="deine@email.de"
		/>
	</div>

	<div>
		<label for="password" class="block text-sm font-medium text-foreground">Passwort</label>
		<input
			id="password"
			type="password"
			bind:value={password}
			required
			class="input mt-1 w-full"
			placeholder="••••••••"
		/>
	</div>

	<button type="submit" class="btn btn-primary w-full" disabled={loading}>
		{#if loading}
			<span
				class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
			></span>
		{:else}
			Anmelden
		{/if}
	</button>

	<p class="text-center text-sm text-muted-foreground">
		Noch kein Konto?
		<a href="/register" class="text-primary hover:underline">Registrieren</a>
	</p>
</form>
