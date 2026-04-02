<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import MoodlitLogo from '$lib/components/MoodlitLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<RegisterPage
	appName="Moodlit"
	logo={MoodlitLogo}
	primaryColor="#7c3aed"
	onSignUp={(e, p) => authStore.signUp(e, p)}
	{goto}
	successRedirect="/moods"
	loginPath="/auth/login"
/>
