<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { form, data } = $props();
	let loading = $state(false);
	let hasToken = $state(false);
	let verifying = $state(true);
	let verificationError = $state<string | null>(null);

	onMount(async () => {
		// Check if we have tokens in the URL hash (from password recovery email)
		const hash = window.location.hash.substring(1); // Remove the '#'
		const hashParams = new URLSearchParams(hash);
		const accessToken = hashParams.get('access_token');
		const refreshToken = hashParams.get('refresh_token');
		const type = hashParams.get('type');

		// Check if we have a token in the URL query params (from Supabase email link)
		const queryToken = $page.url.searchParams.get('token');
		const queryType = $page.url.searchParams.get('type');

		if (accessToken && refreshToken && type === 'recovery') {
			// Have tokens in hash - need to establish session
			try {
				const response = await fetch('/api/auth/set-session', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						access_token: accessToken,
						refresh_token: refreshToken
					})
				});

				const result = await response.json();

				if (result.success) {
					hasToken = true;
					// Clean up URL by removing hash
					window.history.replaceState({}, '', '/auth/reset-password');
				} else {
					verificationError = result.error || 'Failed to establish session';
				}
			} catch (error) {
				console.error('Session establishment error:', error);
				verificationError = 'Failed to establish session';
			} finally {
				verifying = false;
			}
		} else if (queryToken && queryType === 'recovery') {
			// Have token in query params - need to verify via OTP
			try {
				const response = await fetch('/api/auth/verify-token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: queryToken, type: queryType })
				});

				const result = await response.json();

				if (result.success) {
					hasToken = true;
					// Clean up URL by removing query params
					window.history.replaceState({}, '', '/auth/reset-password');
				} else {
					verificationError = result.error || 'Invalid or expired reset link';
				}
			} catch (error) {
				console.error('Token verification error:', error);
				verificationError = 'Failed to verify reset link';
			} finally {
				verifying = false;
			}
		} else {
			// No token found
			verifying = false;
		}
	});
</script>

<svelte:head>
	<title>Reset Password - ManaCore</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8">
	<div class="w-full max-w-md">
		<div class="text-center">
			<h2 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
			<p class="text-gray-600 dark:text-gray-400">
				{#if verifying}
					Verifying your reset link...
				{:else if hasToken}
					Enter your new password
				{:else}
					Token missing or expired
				{/if}
			</p>
		</div>

		{#if verifying}
			<Card class="mt-8">
				<div class="text-center">
					<div class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
					<p class="text-gray-600 dark:text-gray-400">
						Verifying your password reset link...
					</p>
				</div>
			</Card>
		{:else if verificationError}
			<Card class="mt-8">
				<div class="text-center">
					<div class="mb-4 text-6xl">⚠️</div>
					<p class="mb-4 text-gray-600 dark:text-gray-400">
						{verificationError}
					</p>
					<a href="/forgot-password" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
						Request a new reset link
					</a>
				</div>
			</Card>
		{:else if hasToken}
			<Card class="mt-8">
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							await update();
							loading = false;
						};
					}}
				>
					{#if form?.error}
						<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
							{form.error}
						</div>
					{/if}

					<div class="space-y-4">
						<div>
							<label for="password" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
								New Password
							</label>
							<Input
								type="password"
								name="password"
								id="password"
								autocomplete="new-password"
								placeholder="••••••••"
								required
								minlength={6}
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Must be at least 6 characters
							</p>
						</div>

						<div>
							<label for="confirmPassword" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
								Confirm Password
							</label>
							<Input
								type="password"
								name="confirmPassword"
								id="confirmPassword"
								autocomplete="new-password"
								placeholder="••••••••"
								required
								minlength={6}
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
					<a href="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
						Back to login
					</a>
				</div>
			</Card>
		{/if}
	</div>
</div>
