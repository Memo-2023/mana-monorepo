<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { StorytellerLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="Märchenzauber"
	logo={StorytellerLogo}
	primaryColor="#FF6B9D"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#fff5f8"
	darkBackground="#1a1218"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
