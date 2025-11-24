<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Session } from '@supabase/supabase-js';

	interface LayoutData {
		session?: Session | null;
	}

	let { children, data }: { children: any; data: LayoutData } = $props();

	// Redirect to dashboard if already authenticated
	onMount(() => {
		if (data.session) {
			goto('/dashboard');
		}
	});
</script>

{@render children?.()}
