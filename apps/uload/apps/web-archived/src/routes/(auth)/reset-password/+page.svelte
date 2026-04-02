<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from 'svelte-sonner';

	const token = $derived($page.url.searchParams.get('token'));
	let password = $state('');
	let passwordConfirm = $state('');
	let isSubmitting = $state(false);
	let success = $state(false);

	async function handleReset() {
		if (!token) return;
		if (password !== passwordConfirm) {
			toast.error('Passwörter stimmen nicht überein');
			return;
		}
		isSubmitting = true;
		const result = await authStore.resetPasswordWithToken(token, password);
		isSubmitting = false;
		if (result.success) {
			success = true;
		} else {
			toast.error(result.error || 'Fehler beim Zurücksetzen');
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<div
		class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800"
	>
		{#if !token}
			<div class="text-center">
				<p class="text-lg font-bold">Ungültiger Link</p>
				<a href="/forgot-password" class="mt-4 inline-block text-indigo-600 hover:underline"
					>Neuen Link anfordern</a
				>
			</div>
		{:else if success}
			<div class="text-center">
				<p class="text-lg font-bold">Passwort zurückgesetzt!</p>
				<a
					href="/login"
					class="mt-4 inline-block rounded-lg bg-indigo-600 px-6 py-2 text-white hover:bg-indigo-700"
					>Zum Login</a
				>
			</div>
		{:else}
			<h1 class="mb-6 text-center text-2xl font-bold">Neues Passwort setzen</h1>
			<div class="space-y-4">
				<input
					type="password"
					bind:value={password}
					placeholder="Neues Passwort"
					minlength={8}
					required
					class="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700"
				/>
				<input
					type="password"
					bind:value={passwordConfirm}
					placeholder="Passwort bestätigen"
					minlength={8}
					required
					class="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700"
				/>
				<button
					onclick={handleReset}
					disabled={isSubmitting || !password || !passwordConfirm}
					class="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
				>
					{isSubmitting ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
				</button>
			</div>
			<p class="mt-4 text-center text-sm opacity-60">
				<a href="/login" class="text-indigo-600 hover:underline">Zurück zum Login</a>
			</p>
		{/if}
	</div>
</div>
