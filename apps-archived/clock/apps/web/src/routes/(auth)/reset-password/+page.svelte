<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ClockLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	let loading = $state(false);
	let hasToken = $state(false);
	let token = $state<string | null>(null);
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(() => {
		token = $page.url.searchParams.get('token');
		hasToken = !!token;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!token) {
			error = 'Invalid or missing token';
			return;
		}
		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}
		if (password.length < 8) {
			error = 'Password must be at least 8 characters';
			return;
		}

		loading = true;
		try {
			const result = await authStore.resetPasswordWithToken(token, password);
			if (!result.success) {
				error = result.error || 'Failed to reset password';
			} else {
				success = true;
				setTimeout(() => goto('/login'), 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Reset Password - Clock</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-gradient-to-b from-amber-100 to-white dark:from-stone-900 dark:to-stone-800"
>
	<header class="flex items-center justify-between p-4">
		<a href="/" class="flex items-center gap-2">
			<ClockLogo class="h-8 w-8" />
			<span class="text-xl font-semibold" style="color: #f59e0b">Clock</span>
		</a>
	</header>

	<main class="flex flex-1 items-center justify-center p-4">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					{#if success}Password reset successfully
					{:else if hasToken}Enter your new password
					{:else}Invalid or missing token{/if}
				</p>
			</div>

			{#if success}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x2705;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							Your password has been reset successfully. You will be redirected to the login page
							shortly.
						</p>
						<a
							href="/login"
							class="inline-block rounded-lg px-6 py-3 font-medium text-white transition-colors"
							style="background-color: #f59e0b"
						>
							Go to login
						</a>
					</div>
				</div>
			{:else if hasToken}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
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
									>New Password</label
								>
								<input
									type="password"
									id="password"
									autocomplete="new-password"
									placeholder="Enter new password"
									required
									minlength={8}
									bind:value={password}
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
									style="--tw-ring-color: #f59e0b80; border-color: #f59e0b"
								/>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">At least 8 characters</p>
							</div>
							<div>
								<label
									for="confirmPassword"
									class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
									>Confirm Password</label
								>
								<input
									type="password"
									id="confirmPassword"
									autocomplete="new-password"
									placeholder="Confirm password"
									required
									minlength={8}
									bind:value={confirmPassword}
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
								/>
							</div>
							<button
								type="submit"
								disabled={loading}
								class="w-full rounded-lg px-4 py-3 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
								style="background-color: #f59e0b"
							>
								{loading ? 'Updating password...' : 'Update Password'}
							</button>
						</div>
					</form>
				</div>
			{:else}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							This password reset link is invalid or has expired.
						</p>
						<a
							href="/forgot-password"
							class="inline-block rounded-lg px-6 py-3 font-medium text-white transition-colors"
							style="background-color: #f59e0b"
						>
							Request a new link
						</a>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
