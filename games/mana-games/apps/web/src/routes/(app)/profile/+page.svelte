<script lang="ts">
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
</script>

<svelte:head>
	<title>Profil - Mana Games</title>
</svelte:head>

{#if authStore.isAuthenticated}
	<ProfilePage {authStore} {goto} />
{:else}
	<div class="max-w-2xl mx-auto text-center py-12">
		<p class="text-muted-foreground">Bitte melde dich an.</p>
		<a href="/login" class="text-primary hover:underline mt-2 inline-block">Anmelden</a>
	</div>
{/if}
