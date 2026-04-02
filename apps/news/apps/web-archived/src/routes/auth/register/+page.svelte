<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import NewsLogo from '$lib/components/NewsLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="News Hub"
	logo={NewsLogo}
	primaryColor="#10b981"
	onSignUp={handleSignUp}
	{goto}
	successRedirect="/feed"
	loginPath="/auth/login"
/>
