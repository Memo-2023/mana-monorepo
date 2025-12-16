<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get referral code from URL if present
	let initialReferralCode = $derived($page.url.searchParams.get('ref') || '');

	async function handleSignUp(
		email: string,
		password: string,
		name: string,
		referralCode?: string
	) {
		return authStore.signUp(email, password, name, referralCode);
	}

	async function handleValidateReferralCode(code: string) {
		return authStore.validateReferralCode(code);
	}
</script>

<RegisterPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	onValidateReferralCode={handleValidateReferralCode}
	{initialReferralCode}
	baseSignupCredits={25}
	{goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
