<script lang="ts">
	let email = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		try {
			// TODO: Implement password reset via mana-core-auth
			console.log('Reset password for:', email);
			error =
				'Passwort-Zurücksetzen noch nicht implementiert. Bitte verwenden Sie das ManaCore Auth System.';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Anfrage fehlgeschlagen';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Passwort vergessen | Finance</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Passwort vergessen</h1>
			<p class="mt-2 text-muted-foreground">
				Geben Sie Ihre E-Mail-Adresse ein, um Ihr Passwort zurückzusetzen
			</p>
		</div>

		{#if success}
			<div class="rounded-lg bg-green-500/10 p-4 text-center text-green-600">
				<p class="font-medium">E-Mail gesendet!</p>
				<p class="mt-1 text-sm">Überprüfen Sie Ihren Posteingang für weitere Anweisungen.</p>
			</div>
		{:else}
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

				{#if error}
					<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
				{/if}

				<button
					type="submit"
					disabled={isLoading}
					class="w-full rounded-lg bg-primary py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{isLoading ? 'Senden...' : 'Link senden'}
				</button>
			</form>
		{/if}

		<div class="text-center text-sm text-muted-foreground">
			<a href="/login" class="text-primary hover:underline">Zurück zur Anmeldung</a>
		</div>
	</div>
</div>
