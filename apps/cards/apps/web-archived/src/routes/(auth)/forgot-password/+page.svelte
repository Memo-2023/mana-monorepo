<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { CardsLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Cards"
	logo={CardsLogo}
	primaryColor="#8b5cf6"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1a1625"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
