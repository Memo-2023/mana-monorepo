<script lang="ts">
	import { goto } from '$app/navigation';
	import { locale } from 'svelte-i18n';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { getRegisterTranslations } from '@manacore/shared-i18n';
	import { ClockLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	// Get translations based on current locale
	const translations = $derived(getRegisterTranslations($locale || 'de'));

	async function handleSignUp(email: string, password: string, name: string) {
		return authStore.signUp(email, password, name);
	}
</script>

<RegisterPage
	appName="Clock"
	logo={ClockLogo}
	primaryColor="#f59e0b"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/"
	loginPath="/login"
	lightBackground="#fef3c7"
	darkBackground="#1f1612"
	{translations}
/>
