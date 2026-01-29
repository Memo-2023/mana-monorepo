<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { ArrowLeft } from '@manacore/shared-icons';

	let email = $state('');
	let error = $state<string | null>(null);
	let loading = $state(false);
	let success = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;
		loading = true;

		const result = await authStore.resetPassword(email);

		if (result.success) {
			success = true;
		} else {
			error = result.error || 'Failed to send reset email';
		}

		loading = false;
	}
</script>

<div class="rounded-xl bg-card p-8 shadow-lg">
	<div class="mb-8 text-center">
		<h1 class="text-2xl font-bold text-foreground">Reset Password</h1>
		<p class="mt-2 text-muted-foreground">Enter your email to receive a reset link</p>
	</div>

	{#if success}
		<div class="text-center">
			<div class="mb-4 text-4xl">📧</div>
			<h2 class="mb-2 text-lg font-semibold text-foreground">Check your email</h2>
			<p class="mb-4 text-muted-foreground">
				We've sent a password reset link to <strong>{email}</strong>. Please check your inbox.
			</p>
			<a href="/login" class="text-primary hover:underline">Back to login</a>
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

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
			>
				{loading ? 'Sending...' : 'Send Reset Link'}
			</button>
		</form>

		<div class="mt-6 text-center">
			<a
				href="/login"
				class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to login
			</a>
		</div>
	{/if}
</div>
