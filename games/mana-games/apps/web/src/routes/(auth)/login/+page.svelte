<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Mana Games - Login</title>
</svelte:head>

<LoginPage
	{authStore}
	{goto}
	appName="Mana Games"
	registerHref="/register"
	forgotPasswordHref="/forgot-password"
	primaryColor="#00ff88"
/>
