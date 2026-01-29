<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { getForgotPasswordTranslations } from '@manacore/shared-i18n';
	import { SkillTreeLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get translations (default to German for this app)
	const translations = $derived(getForgotPasswordTranslations('de'));

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<svelte:head>
	<title>{translations.titleForm} | SkillTree</title>
</svelte:head>

<ForgotPasswordPage
	appName="SkillTree"
	logo={SkillTreeLogo}
	primaryColor="#10b981"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#d1fae5"
	darkBackground="#064e3b"
	{translations}
/>
