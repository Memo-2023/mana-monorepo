<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button, Input, Card } from '@mana/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';

	let loading = $state(false);
	let hasToken = $state(false);
	let token = $state<string | null>(null);
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(() => {
		// Get token from URL query parameter
		token = $page.url.searchParams.get('token');
		hasToken = !!token;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!token) {
			error = 'Reset token is missing';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 12) {
			error = 'Password must be at least 12 characters';
			return;
		}

		loading = true;

		try {
			const result = await authStore.resetPassword(token, password);

			if (!result.success) {
				error = result.error || 'Failed to reset password';
			} else {
				success = true;
				// Redirect to login after 3 seconds
				setTimeout(() => {
					goto('/login');
				}, 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div>
	<div class="text-center">
		<h2 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
		<p class="text-gray-600 dark:text-gray-400">
			{#if success}
				Password reset successfully
			{:else if hasToken}
				Enter your new password
			{:else}
				Invalid or missing reset token
			{/if}
		</p>
	</div>

	{#if success}
		<Card class="mt-8">
			<div class="text-center">
				<div class="mb-4 text-6xl">✅</div>
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					Your password has been reset successfully. You will be redirected to the login page
					shortly.
				</p>
				<a
					href="/login"
					class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
				>
					Go to login
				</a>
			</div>
		</Card>
	{:else if hasToken}
		<Card class="mt-8">
			<form onsubmit={handleSubmit}>
				{#if error}
					<div
						class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
					>
						{error}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label
							for="password"
							class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
						>
							New Password
						</label>
						<Input
							type="password"
							name="password"
							id="password"
							autocomplete="new-password"
							placeholder="Enter new password"
							required
							minlength={12}
							bind:value={password}
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Must be at least 12 characters
						</p>
					</div>

					<div>
						<label
							for="confirmPassword"
							class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
						>
							Confirm Password
						</label>
						<Input
							type="password"
							name="confirmPassword"
							id="confirmPassword"
							autocomplete="new-password"
							placeholder="Confirm new password"
							required
							minlength={12}
							bind:value={confirmPassword}
						/>
					</div>

					<div>
						<Button type="submit" {loading} class="w-full">
							{loading ? 'Updating password...' : 'Update password'}
						</Button>
					</div>
				</div>
			</form>
		</Card>
	{:else}
		<Card class="mt-8">
			<div class="text-center">
				<div class="mb-4 text-6xl">⚠️</div>
				<p class="mb-4 text-gray-600 dark:text-gray-400">
					This password reset link is invalid or has expired.
				</p>
				<a
					href="/forgot-password"
					class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
				>
					Request a new reset link
				</a>
			</div>
		</Card>
	{/if}
</div>
