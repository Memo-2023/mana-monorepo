<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let error = $state('');
	let success = $state(false);
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		isLoading = true;

		try {
			const result = await authStore.signUp(email, password, name || undefined);
			if (result.success) {
				success = true;
			} else {
				error = result.error || 'Registrierung fehlgeschlagen';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="w-full max-w-md p-8 rounded-xl border"
	style="background-color: var(--color-surface); border-color: var(--color-border);"
>
	<h1 class="text-2xl font-bold mb-6" style="color: var(--color-text);">Registrieren</h1>

	{#if success}
		<div
			class="p-4 rounded-lg"
			style="background-color: var(--color-success-bg, rgba(34, 197, 94, 0.1)); border: 1px solid var(--color-success, #22c55e);"
		>
			<p style="color: var(--color-success, #22c55e);">
				Registrierung erfolgreich! Du kannst dich jetzt anmelden.
			</p>
			<a
				href="/login"
				class="hover:underline mt-2 inline-block"
				style="color: var(--color-primary);">Zum Login</a
			>
		</div>
	{:else}
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
					for="name"
					class="block text-sm font-medium mb-1"
					style="color: var(--color-text-muted);">Name (optional)</label
				>
				<input
					id="name"
					type="text"
					bind:value={name}
					class="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
					style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text);"
				/>
			</div>

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
					minlength="8"
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
				{isLoading ? 'Wird registriert...' : 'Registrieren'}
			</button>
		</form>

		<p class="mt-6 text-center text-sm" style="color: var(--color-text-muted);">
			Bereits ein Konto? <a
				href="/login"
				class="hover:underline"
				style="color: var(--color-primary);">Anmelden</a
			>
		</p>
	{/if}
</div>
