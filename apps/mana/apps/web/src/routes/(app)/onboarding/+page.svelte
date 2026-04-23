<!--
  /onboarding — bare entry point. The real first step is /onboarding/name;
  a user who lands here (typo, bookmark of the parent route) is forwarded.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		goto('/onboarding/name', { replaceState: true });
	});
</script>
