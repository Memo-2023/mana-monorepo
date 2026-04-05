<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@mana/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Arcade - Login</title>
</svelte:head>

<LoginPage
	{authStore}
	{goto}
	appName="Arcade"
	registerHref="/register"
	forgotPasswordHref="/forgot-password"
	primaryColor="#00ff88"
/>
