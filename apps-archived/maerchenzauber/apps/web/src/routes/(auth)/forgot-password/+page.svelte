<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { StorytellerLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleForgotPassword(email: string) {
		return authStore.forgotPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Märchenzauber"
	logo={StorytellerLogo}
	primaryColor="#FF6B9D"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#fff5f8"
	darkBackground="#1a1218"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
