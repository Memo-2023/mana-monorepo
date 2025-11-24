<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ManaCoreLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="ManaCore"
	logo={ManaCoreLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#f3f4f6"
	darkBackground="#121212"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
