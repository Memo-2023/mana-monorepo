<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ContextLogo } from '@manacore/shared-branding';
	import { authStore } from '$lib/stores/auth.svelte';
	import '$lib/i18n';

	async function handleForgotPassword(email: string) {
		return authStore.resetPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Context"
	logo={ContextLogo}
	primaryColor="#0ea5e9"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f0f9ff"
	darkBackground="#0c1222"
/>
