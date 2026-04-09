<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@mana/shared-auth-ui';
	import { ManaLogo } from '@mana/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleForgotPassword(email: string) {
		// resetPassword is the wrapper's "send-the-email" entry point.
		// resetPasswordWithToken is the actually-perform-the-reset step.
		return authStore.resetPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Mana"
	logo={ManaLogo}
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
