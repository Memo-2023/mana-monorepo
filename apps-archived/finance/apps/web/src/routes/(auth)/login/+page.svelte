<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		try {
			// TODO: Implement login via mana-core-auth
			// For now, just a placeholder
			console.log('Login:', email, password);
			error = 'Login noch nicht implementiert. Bitte verwenden Sie das ManaCore Auth System.';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Login fehlgeschlagen';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Login | Finance</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Anmelden</h1>
			<p class="mt-2 text-muted-foreground">Melden Sie sich bei Finance an</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium">E-Mail</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="w-full rounded-lg border border-border bg-background px-3 py-2"
					placeholder="ihre@email.de"
				/>
			</div>

			<div>
				<label for="password" class="mb-1 block text-sm font-medium">Passwort</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					class="w-full rounded-lg border border-border bg-background px-3 py-2"
					placeholder="••••••••"
				/>
			</div>

			{#if error}
				<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
			{/if}

			<button
				type="submit"
				disabled={isLoading}
				class="w-full rounded-lg bg-primary py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{isLoading ? 'Anmelden...' : 'Anmelden'}
			</button>
		</form>

		<div class="text-center text-sm">
			<a href="/forgot-password" class="text-primary hover:underline">Passwort vergessen?</a>
		</div>

		<div class="text-center text-sm text-muted-foreground">
			Noch kein Konto? <a href="/register" class="text-primary hover:underline">Registrieren</a>
		</div>
	</div>
</div>
