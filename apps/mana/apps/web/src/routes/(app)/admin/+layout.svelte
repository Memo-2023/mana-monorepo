<!--
  /admin/* layout — auth guard only.

  The nav-tabs and dashboard chrome moved into individual workbench
  cards (admin, admin-users, admin-system, admin-user-data,
  complexity). Each card owns its own header and renders equally well
  inside the workbench or under its own /admin/* route wrapper.

  This layout's only remaining job is to keep non-admin users out of
  the /admin/* URL space. The cards themselves also re-check the role
  inline because they can be rendered in workbench scenes outside this
  layout's scope.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children }: { children: Snippet } = $props();

	let isAdmin = $derived(authStore.user?.role === 'admin');
	$effect(() => {
		if (authStore.initialized && !authStore.loading && !isAdmin) {
			goto('/');
		}
	});
</script>

{#if !isAdmin}
	<div class="gate">
		<div class="icon" aria-hidden="true">🔒</div>
		<h3>Zugriff verweigert</h3>
		<p>Du hast keine Admin-Berechtigung.</p>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	.gate {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
	}
	.icon {
		font-size: 2.5rem;
		margin-bottom: 0.75rem;
	}
	.gate h3 {
		font-size: 1.125rem;
		font-weight: 500;
		margin: 0 0 0.5rem;
		color: hsl(var(--color-foreground));
	}
	.gate p {
		font-size: 0.875rem;
		margin: 0;
	}
</style>
