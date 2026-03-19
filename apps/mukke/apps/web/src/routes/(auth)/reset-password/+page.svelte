<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { MukkeLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	let loading = $state(false);
	let hasToken = $state(false);
	let token = $state<string | null>(null);
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);

	const t = {
		title: 'Reset Password',
		subtitle: 'Enter your new password',
		newPassword: 'New Password',
		confirmPassword: 'Confirm Password',
		placeholder: 'Enter new password',
		confirmPlaceholder: 'Confirm password',
		submit: 'Update Password',
		submitting: 'Updating password...',
		success: 'Password reset successfully',
		successMessage:
			'Your password has been reset successfully. You will be redirected to the login page shortly.',
		goToLogin: 'Go to login',
		invalidToken: 'Invalid or missing token',
		invalidTokenMessage: 'This password reset link is invalid or has expired.',
		requestNew: 'Request a new link',
		passwordMismatch: 'Passwords do not match',
		passwordTooShort: 'Password must be at least 8 characters',
		minChars: 'At least 8 characters',
	};

	onMount(() => {
		token = $page.url.searchParams.get('token');
		hasToken = !!token;
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = null;

		if (!token) {
			error = t.invalidToken;
			return;
		}

		if (password !== confirmPassword) {
			error = t.passwordMismatch;
			return;
		}

		if (password.length < 8) {
			error = t.passwordTooShort;
			return;
		}

		loading = true;

		try {
			const result = await authStore.resetPasswordWithToken(token, password);

			if (!result.success) {
				error = result.error || 'Failed to reset password';
			} else {
				success = true;
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

<svelte:head>
	<title>{t.title} - Mukke</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-gradient-to-b from-orange-100 to-white dark:from-stone-900 dark:to-stone-800"
>
	<header class="flex items-center justify-between p-4">
		<a href="/" class="flex items-center gap-2">
			<MukkeLogo class="h-8 w-8" />
			<span class="text-xl font-semibold text-orange-600 dark:text-orange-400">Mukke</span>
		</a>
	</header>

	<main class="flex flex-1 items-center justify-center p-4">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
				<p class="mt-2 text-gray-600 dark:text-gray-400">
					{#if success}
						{t.success}
					{:else if hasToken}
						{t.subtitle}
					{:else}
						{t.invalidToken}
					{/if}
				</p>
			</div>

			{#if success}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-stone-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x2705;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{t.successMessage}
						</p>
						<a
							href="/login"
							class="inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
						>
							{t.goToLogin}
						</a>
					</div>
				</div>
			{:else if hasToken}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-stone-800">
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
									{t.newPassword}
								</label>
								<input
									type="password"
									name="password"
									id="password"
									autocomplete="new-password"
									placeholder={t.placeholder}
									required
									minlength={8}
									bind:value={password}
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-stone-600 dark:bg-stone-700 dark:text-white dark:placeholder-gray-400"
								/>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									{t.minChars}
								</p>
							</div>

							<div>
								<label
									for="confirmPassword"
									class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100"
								>
									{t.confirmPassword}
								</label>
								<input
									type="password"
									name="confirmPassword"
									id="confirmPassword"
									autocomplete="new-password"
									placeholder={t.confirmPlaceholder}
									required
									minlength={8}
									bind:value={confirmPassword}
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-stone-600 dark:bg-stone-700 dark:text-white dark:placeholder-gray-400"
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								class="w-full rounded-lg bg-orange-500 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading ? t.submitting : t.submit}
							</button>
						</div>
					</form>
				</div>
			{:else}
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-stone-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{t.invalidTokenMessage}
						</p>
						<a
							href="/forgot-password"
							class="inline-block rounded-lg bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
						>
							{t.requestNew}
						</a>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
