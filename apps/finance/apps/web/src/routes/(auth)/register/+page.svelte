<script lang="ts">
	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (password !== confirmPassword) {
			error = 'Passwörter stimmen nicht überein';
			return;
		}

		isLoading = true;
		error = null;

		try {
			// TODO: Implement registration via mana-core-auth
			console.log('Register:', name, email, password);
			error =
				'Registrierung noch nicht implementiert. Bitte verwenden Sie das ManaCore Auth System.';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Registrierung fehlgeschlagen';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Registrieren | Finance</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center">
	<div class="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8">
		<div class="text-center">
			<h1 class="text-2xl font-bold">Registrieren</h1>
			<p class="mt-2 text-muted-foreground">Erstellen Sie ein neues Konto</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium">Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					required
					class="w-full rounded-lg border border-border bg-background px-3 py-2"
					placeholder="Max Mustermann"
				/>
			</div>

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
					minlength="8"
					class="w-full rounded-lg border border-border bg-background px-3 py-2"
					placeholder="••••••••"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="mb-1 block text-sm font-medium"
					>Passwort bestätigen</label
				>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
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
				{isLoading ? 'Registrieren...' : 'Registrieren'}
			</button>
		</form>

		<div class="text-center text-sm text-muted-foreground">
			Bereits ein Konto? <a href="/login" class="text-primary hover:underline">Anmelden</a>
		</div>
	</div>
</div>
