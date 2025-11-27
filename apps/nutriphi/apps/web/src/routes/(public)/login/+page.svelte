<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		const result = await auth.signIn(email, password);

		if (result.success) {
			goto('/meals');
		} else {
			if (result.error === 'INVALID_CREDENTIALS') {
				error = 'Ungültige E-Mail oder Passwort';
			} else if (result.error === 'EMAIL_NOT_VERIFIED') {
				error = 'Bitte bestätige zuerst deine E-Mail-Adresse';
			} else {
				error = result.error || 'Anmeldung fehlgeschlagen';
			}
		}

		isLoading = false;
	}
</script>

<main class="flex min-h-screen items-center justify-center p-4">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
		<div class="mb-6 text-center">
			<div
				class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500"
			>
				<span class="text-4xl">🥗</span>
			</div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Anmelden</h1>
			<p class="mt-2 text-gray-600 dark:text-gray-400">Willkommen zurück bei Nutriphi</p>
		</div>

		{#if error}
			<div class="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
					E-Mail
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					placeholder="deine@email.de"
				/>
			</div>

			<div>
				<label
					for="password"
					class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Passwort
				</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					placeholder="Dein Passwort"
				/>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
			>
				{isLoading ? 'Wird angemeldet...' : 'Anmelden'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<p class="text-gray-600 dark:text-gray-400">
				Noch kein Konto?
				<a
					href="/register"
					class="font-semibold text-green-600 hover:text-green-700 dark:text-green-400"
				>
					Registrieren
				</a>
			</p>
		</div>

		<div class="mt-4 text-center">
			<a
				href="/"
				class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
			>
				Zurück zur Startseite
			</a>
		</div>
	</div>
</main>
