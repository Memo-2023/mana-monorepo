<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

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
</script>

<form onsubmit={handleSubmit} class="space-y-4">
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
