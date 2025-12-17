<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import PictureLogo from '$lib/components/branding/PictureLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);
	let token = $state('');

	onMount(() => {
		token = $page.url.searchParams.get('token') || '';
		if (!token) {
			error = 'Kein Reset-Token gefunden. Bitte fordern Sie einen neuen Link an.';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passworter stimmen nicht uberein';
			return;
		}

		if (password.length < 8) {
			error = 'Passwort muss mindestens 8 Zeichen lang sein';
			return;
		}

		loading = true;

		const result = await authStore.confirmResetPassword(token, password);

		loading = false;

		if (result.success) {
			success = true;
			setTimeout(() => {
				goto('/auth/login');
			}, 3000);
		} else {
			error = result.error || 'Passwort konnte nicht zuruckgesetzt werden';
		}
	}
</script>

<svelte:head>
	<title>Passwort zurucksetzen - Picture</title>
</svelte:head>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f9ff] to-[#e0f2fe] px-4 py-12 dark:from-[#0c1929] dark:to-[#1e3a5f]"
>
	<div class="w-full max-w-md">
		<div class="mb-8 flex justify-center">
			<PictureLogo class="h-12 w-auto" />
		</div>

		<div class="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
			<h1 class="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
				Neues Passwort festlegen
			</h1>

			{#if success}
				<div class="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/20">
					<p class="text-green-800 dark:text-green-200">
						Passwort erfolgreich zuruckgesetzt! Sie werden zur Anmeldung weitergeleitet...
					</p>
				</div>
			{:else if !token}
				<div class="rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
					<p class="text-red-800 dark:text-red-200">{error}</p>
					<button
						onclick={() => goto('/auth/forgot-password')}
						class="mt-4 text-blue-600 hover:underline dark:text-blue-400"
					>
						Neuen Link anfordern
					</button>
				</div>
			{:else}
				<form onsubmit={handleSubmit} class="space-y-6">
					{#if error}
						<div
							class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200"
						>
							{error}
						</div>
					{/if}

					<div>
						<label
							for="password"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Neues Passwort
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							minlength="8"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Mindestens 8 Zeichen"
						/>
					</div>

					<div>
						<label
							for="confirmPassword"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Passwort bestatigen
						</label>
						<input
							id="confirmPassword"
							type="password"
							bind:value={confirmPassword}
							required
							minlength="8"
							class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							placeholder="Passwort wiederholen"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						class="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<span class="flex items-center justify-center gap-2">
								<span
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></span>
								Wird zuruckgesetzt...
							</span>
						{:else}
							Passwort zurucksetzen
						{/if}
					</button>
				</form>

				<p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
					<a href="/auth/login" class="text-blue-600 hover:underline dark:text-blue-400">
						Zuruck zur Anmeldung
					</a>
				</p>
			{/if}
		</div>
	</div>
</div>
