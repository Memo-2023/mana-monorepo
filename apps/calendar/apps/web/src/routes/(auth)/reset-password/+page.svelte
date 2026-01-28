<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { CalendarLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import '$lib/i18n';

	// State
	let loading = $state(false);
	let hasToken = $state(false);
	let token = $state<string | null>(null);
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state<string | null>(null);
	let success = $state(false);

	// Translations based on locale
	const t = $derived({
		title: $locale === 'de' ? 'Passwort zurücksetzen' : 'Reset Password',
		subtitle: $locale === 'de' ? 'Gib dein neues Passwort ein' : 'Enter your new password',
		newPassword: $locale === 'de' ? 'Neues Passwort' : 'New Password',
		confirmPassword: $locale === 'de' ? 'Passwort bestätigen' : 'Confirm Password',
		placeholder: $locale === 'de' ? 'Neues Passwort eingeben' : 'Enter new password',
		confirmPlaceholder: $locale === 'de' ? 'Passwort bestätigen' : 'Confirm password',
		submit: $locale === 'de' ? 'Passwort ändern' : 'Update Password',
		submitting: $locale === 'de' ? 'Passwort wird geändert...' : 'Updating password...',
		success: $locale === 'de' ? 'Passwort erfolgreich geändert' : 'Password reset successfully',
		successMessage:
			$locale === 'de'
				? 'Dein Passwort wurde erfolgreich geändert. Du wirst gleich zur Anmeldeseite weitergeleitet.'
				: 'Your password has been reset successfully. You will be redirected to the login page shortly.',
		goToLogin: $locale === 'de' ? 'Zur Anmeldung' : 'Go to login',
		invalidToken: $locale === 'de' ? 'Ungültiger oder fehlender Token' : 'Invalid or missing token',
		invalidTokenMessage:
			$locale === 'de'
				? 'Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.'
				: 'This password reset link is invalid or has expired.',
		requestNew: $locale === 'de' ? 'Neuen Link anfordern' : 'Request a new link',
		passwordMismatch:
			$locale === 'de' ? 'Passwörter stimmen nicht überein' : 'Passwords do not match',
		passwordTooShort:
			$locale === 'de'
				? 'Passwort muss mindestens 8 Zeichen lang sein'
				: 'Password must be at least 8 characters',
		minChars: $locale === 'de' ? 'Mindestens 8 Zeichen' : 'At least 8 characters',
	});

	onMount(() => {
		// Get token from URL query parameter
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

<svelte:head>
	<title>{t.title} | Kalender</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 to-white dark:from-slate-900 dark:to-slate-800"
>
	<!-- Header -->
	<header class="flex items-center justify-between p-4">
		<a href="/" class="flex items-center gap-2">
			<CalendarLogo class="h-8 w-8" />
			<span class="text-xl font-semibold text-sky-600 dark:text-sky-400">Kalender</span>
		</a>
		<LanguageSelector />
	</header>

	<!-- Main Content -->
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
				<!-- Success State -->
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x2705;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{t.successMessage}
						</p>
						<a
							href="/login"
							class="inline-block rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-600"
						>
							{t.goToLogin}
						</a>
					</div>
				</div>
			{:else if hasToken}
				<!-- Reset Form -->
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
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
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
									class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400"
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								class="w-full rounded-lg bg-sky-500 px-4 py-3 font-medium text-white transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{loading ? t.submitting : t.submit}
							</button>
						</div>
					</form>
				</div>
			{:else}
				<!-- Invalid Token State -->
				<div class="rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800">
					<div class="text-center">
						<div class="mb-4 text-6xl">&#x26A0;&#xFE0F;</div>
						<p class="mb-6 text-gray-600 dark:text-gray-400">
							{t.invalidTokenMessage}
						</p>
						<a
							href="/forgot-password"
							class="inline-block rounded-lg bg-sky-500 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-600"
						>
							{t.requestNew}
						</a>
					</div>
				</div>
			{/if}
		</div>
	</main>
</div>
