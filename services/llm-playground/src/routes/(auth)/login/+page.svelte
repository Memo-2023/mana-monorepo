<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	const redirectTo = $derived($page.url.searchParams.get('redirectTo') || '/');

	onMount(async () => {
		await authStore.initialize();
		if (authStore.isAuthenticated) {
			goto(redirectTo);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		try {
			const result = await authStore.signIn(email, password);
			if (result.success) {
				goto(redirectTo);
			} else {
				error = result.error || 'Login fehlgeschlagen';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Login fehlgeschlagen';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="w-full max-w-md p-8 rounded-xl border"
	style="background-color: var(--color-surface); border-color: var(--color-border);"
>
	<h1 class="text-2xl font-bold mb-6" style="color: var(--color-text);">LLM Playground</h1>
	<p class="mb-6" style="color: var(--color-text-muted);">
		Melde dich an, um den Playground zu nutzen.
	</p>

	{#if error}
		<div
			class="mb-4 p-3 rounded-lg text-sm"
			style="background-color: var(--color-error-bg, rgba(239, 68, 68, 0.1)); border: 1px solid var(--color-error, #ef4444); color: var(--color-error, #ef4444);"
		>
			{error}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<div>
			<label
				for="email"
				class="block text-sm font-medium mb-1"
				style="color: var(--color-text-muted);">E-Mail</label
			>
			<input
				id="email"
				type="email"
				bind:value={email}
				required
				class="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
				style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text);"
			/>
		</div>

		<div>
			<label
				for="password"
				class="block text-sm font-medium mb-1"
				style="color: var(--color-text-muted);">Passwort</label
			>
			<input
				id="password"
				type="password"
				bind:value={password}
				required
				class="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
				style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text);"
			/>
		</div>

		<button
			type="submit"
			disabled={isLoading}
			class="w-full py-2 px-4 font-medium rounded-lg transition-colors disabled:opacity-50"
			style="background-color: var(--color-primary); color: white;"
		>
			{isLoading ? 'Wird angemeldet...' : 'Anmelden'}
		</button>
	</form>

	<p class="mt-6 text-center text-sm" style="color: var(--color-text-muted);">
		Noch kein Konto? <a
			href="/register"
			class="hover:underline"
			style="color: var(--color-primary);">Registrieren</a
		>
	</p>
</div>
