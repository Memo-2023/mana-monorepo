<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get referral code from URL if present
	let initialReferralCode = $derived($page.url.searchParams.get('ref') || '');

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string, referralCode?: string) {
		return authStore.signUp(email, password, referralCode);
	}

	async function handleValidateReferralCode(code: string) {
		return authStore.validateReferralCode(code);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | ManaCore</title>
</svelte:head>

<RegisterPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	onValidateReferralCode={handleValidateReferralCode}
	{initialReferralCode}
	baseSignupCredits={25}
	{goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
