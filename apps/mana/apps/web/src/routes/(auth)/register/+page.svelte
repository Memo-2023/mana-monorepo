<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@mana/shared-auth-ui';
	import { getRegisterTranslations } from '@mana/shared-i18n';
	import { ManaLogo } from '@mana/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { trackGuestConversion } from '$lib/stores/funnel-tracking';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string) {
		const result = await authStore.signUp(email, password);
		if (result.success) {
			// Tracking must never block the success redirect.
			queueMicrotask(() => {
				try {
					trackGuestConversion();
				} catch {
					/* swallow tracking errors */
				}
			});
		}
		return result;
	}

	async function handleResendVerification(email: string) {
		return authStore.resendVerificationEmail(email);
	}
</script>

<svelte:head>
	<title>{translations.title} | Mana</title>
</svelte:head>

<RegisterPage
	appName="Mana"
	logo={ManaLogo}
	primaryColor="hsl(var(--color-primary))"
	onSignUp={handleSignUp}
	onResendVerification={handleResendVerification}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
	{translations}
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
