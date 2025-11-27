<script lang="ts">
	import { goto } from '$app/navigation';
	import { ForgotPasswordPage } from '@manacore/shared-auth-ui';
	import { MemoroLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { auth } from '$lib/stores/auth';

	async function handleForgotPassword(email: string) {
		return auth.forgotPassword(email);
	}
</script>

<ForgotPasswordPage
	appName="Memoro"
	logo={MemoroLogo}
	primaryColor="#f8d62b"
	onForgotPassword={handleForgotPassword}
	{goto}
	loginPath="/login"
	lightBackground="#dddddd"
	darkBackground="#101010"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</ForgotPasswordPage>
