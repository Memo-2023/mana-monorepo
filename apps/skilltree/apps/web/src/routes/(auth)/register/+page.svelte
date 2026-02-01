<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { SkillTreeLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get redirect URL from sessionStorage
	const redirectTo = $derived.by(() => {
		if (browser) {
			const sessionRedirect = sessionStorage.getItem('auth-return-url');
			if (sessionRedirect) {
				sessionStorage.removeItem('auth-return-url');
				return sessionRedirect;
			}
		}
		return '/';
	});

	// Get translations (default to German for this app)
	const translations = $derived(getRegisterTranslations('de'));

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | SkillTree</title>
</svelte:head>

<RegisterPage
	appName="SkillTree"
	logo={SkillTreeLogo}
	primaryColor="#10b981"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect={redirectTo}
	loginPath="/login"
	lightBackground="#d1fae5"
	darkBackground="#064e3b"
	{translations}
/>
