<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let passwordConfirm = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== passwordConfirm) {
			error = 'Passwörter stimmen nicht überein';
			return;
		}

		if (password.length < 8) {
			error = 'Passwort muss mindestens 8 Zeichen lang sein';
			return;
		}

		loading = true;

		const result = await authStore.signUp(email, password);

		if (result.success) {
			if (result.needsVerification) {
				error = 'Bitte bestätige deine E-Mail-Adresse';
			} else {
				goto('/dashboard');
			}
		} else {
			error = result.error || 'Registrierung fehlgeschlagen';
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
			minlength="8"
			class="input mt-1 w-full"
			placeholder="Mindestens 8 Zeichen"
		/>
	</div>

	<div>
		<label for="passwordConfirm" class="block text-sm font-medium text-foreground">
			Passwort bestätigen
		</label>
		<input
			id="passwordConfirm"
			type="password"
			bind:value={passwordConfirm}
			required
			class="input mt-1 w-full"
			placeholder="Passwort wiederholen"
		/>
	</div>

	<button type="submit" class="btn btn-primary w-full" disabled={loading}>
		{#if loading}
			<span
				class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
			></span>
		{:else}
			Registrieren
		{/if}
	</button>

	<p class="text-center text-sm text-muted-foreground">
		Bereits ein Konto?
		<a href="/login" class="text-primary hover:underline">Anmelden</a>
	</p>
</form>
