<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import ManaDeckLogo from '$lib/components/ManaDeckLogo.svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	async function handleSignUp(email: string, password: string) {
		return authStore.signUp(email, password);
	}
</script>

<RegisterPage
	appName="ManaDeck"
	logo={ManaDeckLogo}
	primaryColor="#8b5cf6"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/decks"
	loginPath="/login"
	lightBackground="#faf5ff"
	darkBackground="#1a1625"
/>
