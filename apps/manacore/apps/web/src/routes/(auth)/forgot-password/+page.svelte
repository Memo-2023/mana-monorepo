<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
