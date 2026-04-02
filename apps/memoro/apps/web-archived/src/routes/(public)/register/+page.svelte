<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import MemoroLogo from '$lib/components/MemoroLogo.svelte';
	import LanguageSelector from '$lib/components/LanguageSelector.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Icon from '$lib/components/Icon.svelte';

	import { theme } from '$lib/stores/theme';
	import { ringsInitialized } from '$lib/stores/ringsInitialized';
	import { t } from 'svelte-i18n';

	// Mark rings as initialized (in case user navigates directly here)
	onMount(() => {
		ringsInitialized.set(true);
	});

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
				special: false,
			};
		}

		return {
			length: password.length >= 8,
			lowercase: /[a-z]/.test(password),
			uppercase: /[A-Z]/.test(password),
			digit: /[0-9]/.test(password),
			special: /[^a-zA-Z0-9]/.test(password),
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
				ocean: '#039BE5',
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#f8d62b',
				nature: '#4CAF50',
				stone: '#607D8B',
				ocean: '#039BE5',
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
				ocean: '#121212',
			};
			return colors[variant];
		} else {
			const colors = {
				lume: '#dddddd',
				nature: '#FBFDF8',
				stone: '#F5F7F9',
				ocean: '#F5FCFF',
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

		const result = await authStore.signUp(email, password);

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
	class="flex min-h-screen flex-col justify-between relative overflow-hidden"
	style="background-color: {getPageBackground()};"
>
	<!-- Concentric Circles Background -->
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<svg
			class="min-w-full min-h-full"
			style="width: max(100vw, 100vh); height: max(100vw, 100vh);"
			viewBox="0 0 1000 1000"
			fill="none"
			preserveAspectRatio="xMidYMid slice"
			xmlns="http://www.w3.org/2000/svg"
		>
			{#each [480, 420, 360, 300, 240, 180, 120, 60] as radius, i}
				<circle
					cx="500"
					cy="500"
					r={radius}
					class="ripple-circle"
					style="--delay: {(7 - i) * 0.15}s; --base-opacity: {0.1 + i * 0.1}; --base-stroke: {1 +
						i * 0.5};"
				/>
			{/each}
		</svg>
	</div>

	<!-- Language Selector and Theme Toggle in top right -->
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3">
		<LanguageSelector />
		<ThemeToggle />
	</div>

	<!-- Auth Container -->
	<div class="flex-1 flex items-center justify-center px-5 py-8">
		<div
			class="w-full max-w-md rounded-xl p-6"
			style="background-color: {isDark
				? 'rgba(255, 255, 255, 0.1)'
				: 'rgba(255, 255, 255, 0.6)'}; backdrop-filter: blur(20px); border: 1px solid {isDark
				? 'rgba(255, 255, 255, 0.2)'
				: 'rgba(0, 0, 0, 0.1)'};"
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
						style="background-color: {getPrimaryColor()}60; border-color: {getPrimaryColor()}; color: {isDark
							? '#ffffff'
							: '#000000'};"
					>
						<Icon name="user-plus" size={20} />
						{loading ? $t('auth.creating_account') : $t('auth.create_account')}
					</button>
				</div>
			</form>

			<!-- Info about email-only authentication -->
			<div
				class="mt-4 mb-2 rounded-xl p-4 flex flex-col items-center gap-2"
				style="background-color: {isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};"
			>
				<p
					class="text-xs text-center"
					style="color: {isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'};"
				>
					{$t('auth.email_only_info')}
				</p>
				<button
					onclick={() => (showModal = true)}
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
<Modal
	visible={showModal}
	onClose={() => (showModal = false)}
	title={$t('auth.email_only_title')}
	maxWidth="lg"
>
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
			onclick={() => (showModal = false)}
			class="w-full px-6 py-2 rounded-xl font-medium bg-content hover:bg-menu-hover text-theme border border-theme transition-colors"
		>
			{$t('auth.got_it')}
		</button>
	{/snippet}
</Modal>

<style>
	/* Base circle styles with breathing animation (no intro - rings already visible from login) */
	.ripple-circle {
		opacity: var(--base-opacity);
		transform-origin: center;
		stroke: #f8d62b;
		stroke-width: var(--base-stroke);
		animation: combo 10s cubic-bezier(0.45, 0, 0.55, 1) infinite;
		animation-delay: var(--delay);
		will-change: opacity, transform, stroke-width, stroke, filter;
	}

	@keyframes combo {
		/* Start - Ausatmen beendet */
		0% {
			opacity: calc(var(--base-opacity) * 0.7);
			transform: scale(0.998);
			stroke-width: calc(var(--base-stroke) * 0.9);
			stroke: #e6b800;
			filter: brightness(0.95);
		}
		/* Einatmen Mitte */
		20% {
			opacity: calc(var(--base-opacity) * 0.95);
			transform: scale(1.001);
			stroke-width: calc(var(--base-stroke) * 1.025);
			stroke: #f0c800;
			filter: brightness(1.015);
		}
		/* 40% = 4s Einatmen abgeschlossen */
		40% {
			opacity: calc(var(--base-opacity) * 1.2);
			transform: scale(1.004);
			stroke-width: calc(var(--base-stroke) * 1.15);
			stroke: #f8d62b;
			filter: brightness(1.08);
		}
		/* Ausatmen langsam */
		60% {
			opacity: calc(var(--base-opacity) * 1.05);
			transform: scale(1.002);
			stroke-width: calc(var(--base-stroke) * 1.075);
			stroke: #f4cf20;
			filter: brightness(1.04);
		}
		80% {
			opacity: calc(var(--base-opacity) * 0.85);
			transform: scale(0.999);
			stroke-width: calc(var(--base-stroke) * 0.95);
			stroke: #ebc010;
			filter: brightness(0.98);
		}
		/* 100% = 6s Ausatmen abgeschlossen */
		100% {
			opacity: calc(var(--base-opacity) * 0.7);
			transform: scale(0.998);
			stroke-width: calc(var(--base-stroke) * 0.9);
			stroke: #e6b800;
			filter: brightness(0.95);
		}
	}
</style>
