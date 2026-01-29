<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		loading = true;

		const result = await authStore.signIn(email, password);

		if (result.success) {
			const token = await authStore.getValidToken();
			apiClient.setAccessToken(token);
			goto('/');
		} else {
			error = result.error || 'Login failed';
		}

		loading = false;
	}
</script>

<div class="rounded-xl bg-card p-8 shadow-lg">
	<div class="mb-8 text-center">
		<h1 class="text-2xl font-bold text-foreground">Questions</h1>
		<p class="mt-2 text-muted-foreground">Sign in to your account</p>
	</div>

	<form onsubmit={handleSubmit} class="space-y-4">
		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		<div>
			<label for="email" class="mb-1 block text-sm font-medium text-foreground">Email</label>
			<input
				type="email"
				id="email"
				bind:value={email}
				required
				class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				placeholder="you@example.com"
			/>
		</div>

		<div>
			<label for="password" class="mb-1 block text-sm font-medium text-foreground">Password</label>
			<input
				type="password"
				id="password"
				bind:value={password}
				required
				class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				placeholder="••••••••"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
		>
			{loading ? 'Signing in...' : 'Sign in'}
		</button>
	</form>

	<div class="mt-6 text-center text-sm text-muted-foreground">
		<a href="/forgot-password" class="text-primary hover:underline">Forgot password?</a>
		<span class="mx-2">·</span>
		<a href="/register" class="text-primary hover:underline">Create account</a>
	</div>
</div>
