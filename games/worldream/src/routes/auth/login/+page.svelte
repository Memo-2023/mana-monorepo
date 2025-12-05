<script lang="ts">
	import { createClient } from '$lib/supabase/client';
	import { goto } from '$app/navigation';

	const supabase = createClient();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let mode: 'login' | 'signup' = $state('login');

	async function handleAuth() {
		loading = true;
		error = null;

		try {
			if (mode === 'login') {
				const { error: authError } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				if (authError) throw authError;
			} else {
				const { error: authError } = await supabase.auth.signUp({
					email,
					password,
				});
				if (authError) throw authError;
			}

			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten';
		} finally {
			loading = false;
		}
	}

	function toggleMode() {
		mode = mode === 'login' ? 'signup' : 'login';
		error = null;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-theme-base">
	<div class="w-full max-w-md space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-theme-text-primary">
				{mode === 'login' ? 'Anmelden' : 'Registrieren'}
			</h2>
		</div>
		<form class="mt-8 space-y-6" onsubmit={handleAuth}>
			{#if error}
				<div class="bg-theme-error/10 rounded-md p-4">
					<p class="text-sm text-theme-error">{error}</p>
				</div>
			{/if}

			<div class="-space-y-px rounded-md shadow-sm">
				<div>
					<label for="email" class="sr-only">E-Mail</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						bind:value={email}
						class="border-theme-border-default relative block w-full appearance-none rounded-none rounded-t-md border bg-theme-elevated px-3 py-2 text-theme-text-primary placeholder-theme-text-tertiary focus:z-10 focus:border-theme-primary-500 focus:outline-none focus:ring-theme-primary-500 sm:text-sm"
						placeholder="E-Mail Adresse"
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Passwort</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						bind:value={password}
						class="border-theme-border-default relative block w-full appearance-none rounded-none rounded-b-md border bg-theme-elevated px-3 py-2 text-theme-text-primary placeholder-theme-text-tertiary focus:z-10 focus:border-theme-primary-500 focus:outline-none focus:ring-theme-primary-500 sm:text-sm"
						placeholder="Passwort"
					/>
				</div>
			</div>

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative flex w-full justify-center rounded-md border border-transparent bg-theme-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-theme-primary-700 focus:outline-none focus:ring-2 focus:ring-theme-primary-500 focus:ring-offset-2 disabled:opacity-50"
				>
					{loading ? 'Wird verarbeitet...' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
				</button>
			</div>

			<div class="text-center">
				<button
					type="button"
					onclick={toggleMode}
					class="text-sm text-theme-primary-600 hover:text-theme-primary-500"
				>
					{mode === 'login'
						? 'Noch kein Konto? Jetzt registrieren'
						: 'Bereits registriert? Jetzt anmelden'}
				</button>
			</div>
		</form>
	</div>
</div>
