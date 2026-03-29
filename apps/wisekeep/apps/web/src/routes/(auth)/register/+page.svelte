<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import WisekeepLogo from '$lib/components/WisekeepLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<RegisterPage
	appName="Wisekeep"
	logo={WisekeepLogo}
	primaryColor="#8b5cf6"
	onSignUp={(email, password) => authStore.signUp(email, password)}
	{goto}
	successRedirect="/transcribe"
	loginPath="/auth/login"
/>
