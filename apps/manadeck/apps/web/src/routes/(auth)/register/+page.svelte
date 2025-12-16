<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import { ManaDeckLogo } from '@manacore/shared-branding';
	import AppSlider from '$lib/components/AppSlider.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignUp(email: string, password: string, name: string) {
		return authStore.signUp(email, password, name);
	}
</script>

<RegisterPage
	appName="ManaDeck"
	logo={ManaDeckLogo}
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/decks"
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1a1625"
>
	{#snippet appSlider()}
		<AppSlider />
	{/snippet}
</RegisterPage>
