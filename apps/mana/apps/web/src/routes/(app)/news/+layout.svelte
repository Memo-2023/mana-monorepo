<!--
  News layout — boots the feed-cache poll loop and tears it down on
  navigation away. The cached pool is shared across +page.svelte and
  [id]/+page.svelte (the reader), so it lives at the layout level.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';
	import { feedCacheStore } from '$lib/modules/news/stores/feed-cache.svelte';
	import { usePreferences } from '$lib/modules/news/queries';

	let { children }: { children: Snippet } = $props();

	const prefs$ = usePreferences();
	const prefs = $derived(prefs$.value);

	// Refresh whenever the user's topic/lang selection changes — the
	// server filters server-side, so a different topic mix means a
	// different cache. The store dedupes concurrent refreshes via its
	// `inFlight` guard.
	$effect(() => {
		if (!prefs.onboardingCompleted) return;
		void feedCacheStore.refresh({
			topics: prefs.selectedTopics,
			lang: prefs.preferredLanguages.length === 1 ? prefs.preferredLanguages[0] : 'all',
		});
	});

	onMount(() => {
		// Idempotent — start() is a no-op if the interval is already set.
		feedCacheStore.start();
	});

	onDestroy(() => {
		feedCacheStore.stop();
	});
</script>

{@render children()}
