<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import StorytellerLogo from '$lib/components/StorytellerLogo.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="Storyteller"
	logo={StorytellerLogo}
	primaryColor="#6366f1"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#f5f5f5"
	darkBackground="#121212"
/>
