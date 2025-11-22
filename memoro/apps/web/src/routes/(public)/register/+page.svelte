<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import MemoroLogo from '$lib/components/MemoroLogo.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { auth } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { t } from 'svelte-i18n';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let needsVerification = $state(false);
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let showModal = $state(false);
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);

	let currentTheme = $derived($theme);
	let isDark = $derived(currentTheme.effectiveMode === 'dark');

	// Password validation requirements
	let passwordRequirements = $derived.by(() => {
		if (!password) {
			return {
				length: false,
				lowercase: false,
				uppercase: false,
				digit: false,
				special: false
			};
		}

		return {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^a-zA-Z0-9]/.test(password)
		};
	});

	// Display OAuth error from URL if present
	let oauthError = $derived($page.url.searchParams.get('error'));

	// Get primary color based on theme variant
	function getPrimaryColor() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#78909C',
				ocean: '#039BE5'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5'
			};
			return colors[variant];
		}
	}

	// Get page background based on theme variant
	function getPageBackground() {
		const variant = currentTheme.variant;
		if (isDark) {
			const colors = {
				lume: '#101010',
				nature: '#121212',
				stone: '#121212',
				ocean: '#121212'
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#dddddd',
				nature: '#FBFDF8',
				stone: '#F5F7F9',
				ocean: '#F5FCFF'
			};
			return colors[variant];
		}
	}

	async function handleRegister() {
		loading = true;
		error = null;
		success = false;

		// Client-side validation
		if (!email) {
			error = $t('auth.error_email_required');
			loading = false;
			return;
		}

		if (!password) {
			error = $t('auth.error_password_required');
			loading = false;
			return;
		}

		if (!confirmPassword) {
			error = $t('auth.error_confirm_password');
			loading = false;
			return;
		}

		if (password !== confirmPassword) {
			error = $t('auth.error_passwords_not_match');
			loading = false;
			return;
		}

		if (password.length < 8) {
			error = $t('auth.error_password_too_short');
			loading = false;
			return;
		}

		// Check password strength
		const hasLowercase = /[a-z]/.test(password);
		const hasUppercase = /[A-Z]/.test(password);
		const hasDigit = /[0-9]/.test(password);
		const hasSymbol = /[^a-zA-Z0-9]/.test(password);

		if (!hasLowercase || !hasUppercase || !hasDigit || !hasSymbol) {
			error = $t('auth.error_password_requirements');
			loading = false;
			return;
		}

		const result = await auth.signUp(email, password);

		loading = false;

		if (result.success) {
			if (result.needsVerification) {
				needsVerification = true;
				success = true;
				// Clear sensitive fields but keep email
				password = '';
				confirmPassword = '';
			} else {
				goto('/dashboard');
			}
		} else {
			error = result.error || $t('auth.error_registration_failed');
		}
	}

	function resetForm() {
		email = '';
		password = '';
		confirmPassword = '';
		error = null;
		success = false;
		needsVerification = false;
	}
</script>

<svelte:head>
	<title>{$t('auth.create_account')} - Memoro</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col justify-between"
	style="background-color: {getPageBackground()};"
>
	<!-- Language Selector and Theme Toggle in top right -->
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3 opacity-60">
		<LanguageSelector />
		<ThemeToggle />
	</div>

	<!-- Top Section - Logo and Welcome -->
	<div class="flex flex-col items-center justify-center pt-16 pb-8">
		<div
			class="flex items-center justify-center rounded-full transition-all mb-4 bg-black"
			style="width: 120px; height: 120px; border: 3px solid {getPrimaryColor()}; box-shadow: {isDark
				? '0 6px 12px rgba(0, 0, 0, 0.4)'
				: '0 6px 12px rgba(0, 0, 0, 0.15)'};"
		>
			<MemoroLogo size={55} color={getPrimaryColor()} />
		</div>
		<h1 class="text-2xl font-semibold" style="color: {isDark ? '#ffffff' : '#000000'};">
			Memoro
		</h1>
	</div>

	<!-- Middle Section - Auth Buttons Container -->
	<div class="flex-1 flex items-start justify-center px-5 pt-8 pb-8">
		<div
			class="w-full max-w-md rounded-xl p-6"
			style="background-color: {isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)'}; backdrop-filter: blur(10px); border: 1px solid {isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};"
		>
			<!-- Title -->
			<h2
				class="mb-6 text-center text-xl font-semibold"
				style="color: {isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'};"
			>
				{$t('auth.create_account')}
			</h2>

			<!-- Error Messages -->
			{#if error}
				<div class="mb-4 rounded-lg bg-red-500/20 p-3">
					<p class="text-sm text-red-500">{error}</p>
				</div>
			{/if}

			{#if success && needsVerification}
				<div class="mb-4 rounded-lg bg-green-500/20 p-3">
					<p class="text-sm text-green-500">
						{$t('auth.registration_success')}
					</p>
				</div>
			{/if}

			{#if oauthError}
				<div class="mb-4 rounded-lg bg-red-500/20 p-3">
					<p class="text-sm text-red-500">{oauthError}</p>
				</div>
			{/if}

			<!-- Email Register Form -->
			<form
					onsubmit={(e) => {
						e.preventDefault();
						handleRegister();
					}}
					class="pb-4"
				>
					<div class="mb-2">
						<input
							type="email"
							bind:value={email}
							placeholder={$t('auth.email')}
							required
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(241, 248, 233, 0.5)'}; border-color: {isDark
								? '#424242'
								: '#C8E6C9'}; color: {isDark ? '#ffffff' : '#000000'};"
						/>
					</div>

					<div class="mb-2">
						<input
							type="password"
							bind:value={password}
							placeholder={$t('auth.password')}
							required
							minlength="8"
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(241, 248, 233, 0.5)'}; border-color: {isDark
								? '#424242'
								: '#C8E6C9'}; color: {isDark ? '#ffffff' : '#000000'};"
						/>
					</div>

					<div class="mb-2">
						<input
							type="password"
							bind:value={confirmPassword}
							placeholder={$t('auth.confirm_password')}
							required
							minlength="8"
							class="h-14 w-full rounded-xl border px-4 text-lg transition-colors"
							style="background-color: {isDark
								? 'rgba(0, 0, 0, 0.2)'
								: 'rgba(241, 248, 233, 0.5)'}; border-color: {isDark
								? '#424242'
								: '#C8E6C9'}; color: {isDark ? '#ffffff' : '#000000'};"
						/>
					</div>

					<p
						class="mb-4 mt-2 text-xs"
						style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
					>
						{$t('auth.password_requirement')}
					</p>

					<div class="mb-0 flex flex-col gap-4">
						<button
							type="submit"
							disabled={loading}
							class="flex h-14 items-center justify-center gap-2 rounded-xl font-medium transition-all hover:opacity-80 disabled:opacity-50 border-2"
							style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark ? '#ffffff' : '#000000'};"
						>
							<Icon name="user-plus" size={20} />
							{loading ? $t('auth.creating_account') : $t('auth.create_account')}
						</button>
					</div>
				</form>

				<!-- Info about email-only authentication -->
				<div class="mt-4 mb-2 rounded-xl p-4 flex flex-col items-center gap-2" style="background-color: {isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};">
					<p class="text-xs text-center" style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};">
						{$t('auth.email_only_info')}
					</p>
				<button
					onclick={() => showModal = true}
					class="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
					style="color: {isDark ? '#ffffff' : '#000000'};"
				>
					<Icon name="info" size={16} />
					{$t('auth.email_only_learn_more')}
				</button>
				</div>

				<!-- Back Button -->
				<div class="mt-4">
					<button
						onclick={() => goto('/login')}
						class="flex h-10 w-full items-center justify-center gap-2 rounded-xl font-medium transition-all"
						style="color: {isDark ? '#ffffff' : '#000000'};"
					>
						<Icon name="arrow-left" size={20} />
						{$t('common.back')}
					</button>
				</div>

		</div>
	</div>

</div>

<!-- Modal for "Learn More" -->
<Modal visible={showModal} onClose={() => showModal = false} title={$t('auth.email_only_title')} maxWidth="lg">
	{#snippet children()}
		<div class="space-y-4">
			<p class="text-sm leading-relaxed text-theme">
				{$t('auth.email_only_intro')}
			</p>

			<div class="space-y-2">
				<div class="rounded-xl bg-content p-3 border border-theme flex gap-3">
					<div class="flex-shrink-0 mt-0.5">
						<Icon name="lock" size={20} class="text-theme" />
					</div>
					<div>
						<h3 class="font-medium mb-1 text-theme">{$t('auth.email_only_benefit_1_title')}</h3>
						<p class="text-sm text-theme">{$t('auth.email_only_benefit_1_desc')}</p>
					</div>
				</div>

				<div class="rounded-xl bg-content p-3 border border-theme flex gap-3">
					<div class="flex-shrink-0 mt-0.5">
						<Icon name="shield-check" size={20} class="text-theme" />
					</div>
					<div>
						<h3 class="font-medium mb-1 text-theme">{$t('auth.email_only_benefit_2_title')}</h3>
						<p class="text-sm text-theme">{$t('auth.email_only_benefit_2_desc')}</p>
					</div>
				</div>

				<div class="rounded-xl bg-content p-3 border border-theme flex gap-3">
					<div class="flex-shrink-0 mt-0.5">
						<Icon name="arrows-left-right" size={20} class="text-theme" />
					</div>
					<div>
						<h3 class="font-medium mb-1 text-theme">{$t('auth.email_only_benefit_3_title')}</h3>
						<p class="text-sm text-theme">{$t('auth.email_only_benefit_3_desc')}</p>
					</div>
				</div>

				<div class="rounded-xl bg-content p-3 border border-theme flex gap-3">
					<div class="flex-shrink-0 mt-0.5">
						<Icon name="envelope" size={20} class="text-theme" />
					</div>
					<div>
						<h3 class="font-medium mb-1 text-theme">{$t('auth.email_only_benefit_4_title')}</h3>
						<p class="text-sm text-theme">{$t('auth.email_only_benefit_4_desc')}</p>
					</div>
				</div>
			</div>

			<p class="text-sm leading-relaxed text-theme">
				{$t('auth.email_only_modal_footer')}
			</p>
		</div>
	{/snippet}

	{#snippet footer()}
		<button
			onclick={() => showModal = false}
			class="w-full px-6 py-2 rounded-xl font-medium bg-content hover:bg-menu-hover text-theme border border-theme transition-colors"
		>
			{$t('auth.got_it')}
		</button>
	{/snippet}
</Modal>
