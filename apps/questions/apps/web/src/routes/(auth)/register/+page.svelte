<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);
	let needsVerification = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;

		const result = await authStore.signUp(email, password);

		if (result.success) {
			if (result.needsVerification) {
				needsVerification = true;
			} else {
				const token = await authStore.getValidToken();
				apiClient.setAccessToken(token);
				goto('/');
			}
		} else {
			error = result.error || 'Registration failed';
		}

		loading = false;
	}
</script>

<div class="rounded-xl bg-card p-8 shadow-lg">
	<div class="mb-8 text-center">
		<h1 class="text-2xl font-bold text-foreground">Questions</h1>
		<p class="mt-2 text-muted-foreground">Create your account</p>
	</div>

	{#if needsVerification}
		<div class="text-center">
			<div class="mb-4 text-4xl">📧</div>
			<h2 class="mb-2 text-lg font-semibold">Check your email</h2>
			<p class="text-muted-foreground">
				We've sent a verification link to <strong>{email}</strong>. Please check your inbox and
				click the link to verify your account.
			</p>
			<a href="/login" class="mt-4 inline-block text-primary hover:underline">Back to login</a>
		</div>
	{:else}
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
				<label for="password" class="mb-1 block text-sm font-medium text-foreground">Password</label
				>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					minlength="8"
					class="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					placeholder="••••••••"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="mb-1 block text-sm font-medium text-foreground"
					>Confirm Password</label
				>
				<input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
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
				{loading ? 'Creating account...' : 'Create account'}
			</button>
		</form>

		<div class="mt-6 text-center text-sm text-muted-foreground">
			Already have an account?
			<a href="/login" class="text-primary hover:underline">Sign in</a>
		</div>
	{/if}
</div>
