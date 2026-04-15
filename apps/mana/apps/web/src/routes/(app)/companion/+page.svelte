<!--
  Companion — AI-Workbench carousel.

  Replaces the former split `/companion + /companion/missions +
  /companion/workbench + /companion/rituals` sub-routes with a single
  PageCarousel. Each feature (Chat, Missions, Workbench, Rituals,
  Policy, Insights, Health) lives as one page; user opens / closes /
  reorders / resizes them. Layout persists via localStorage
  (`companionWorkbenchSettings`).
-->
<script lang="ts">
	import { PageCarousel } from '$lib/components/page-carousel';
	import { companionWorkbenchSettings } from '$lib/modules/companion/stores/workbench-settings.svelte';
	import type { CompanionPageId } from '$lib/modules/companion/stores/workbench-settings.svelte';
	import { COMPANION_PAGE_META } from '$lib/modules/companion/pages/page-meta';
	import PagePicker from '$lib/modules/companion/pages/PagePicker.svelte';
	import AiHomePage from '$lib/modules/companion/pages/AiHomePage.svelte';
	import ChatPage from '$lib/modules/companion/pages/ChatPage.svelte';
	import MissionsPage from '$lib/modules/companion/pages/MissionsPage.svelte';
	import WorkbenchPage from '$lib/modules/companion/pages/WorkbenchPage.svelte';
	import RitualsPage from '$lib/modules/companion/pages/RitualsPage.svelte';
	import PolicyPage from '$lib/modules/companion/pages/PolicyPage.svelte';
	import InsightsPage from '$lib/modules/companion/pages/InsightsPage.svelte';
	import HealthPage from '$lib/modules/companion/pages/HealthPage.svelte';
	import type { CarouselPage } from '$lib/components/page-carousel';

	let showPicker = $state(false);

	const openPages = $derived(companionWorkbenchSettings.openPages);

	const carouselPages = $derived<CarouselPage[]>(
		openPages.map((p) => {
			const meta = COMPANION_PAGE_META[p.id];
			return {
				id: p.id,
				title: meta.title,
				color: meta.color,
				icon: meta.icon,
				widthPx: p.widthPx,
				heightPx: p.heightPx,
				maximized: p.maximized ?? false,
			};
		})
	);

	function close(id: CompanionPageId) {
		companionWorkbenchSettings.closePage(id);
	}
	function maximize(id: CompanionPageId) {
		companionWorkbenchSettings.toggleMaximized(id);
	}
	function resize(id: CompanionPageId, widthPx: number, heightPx?: number) {
		companionWorkbenchSettings.resize(id, widthPx, heightPx);
	}
	function moveLeft(id: CompanionPageId) {
		companionWorkbenchSettings.moveLeft(id);
	}
	function moveRight(id: CompanionPageId) {
		companionWorkbenchSettings.moveRight(id);
	}
	function pick(id: CompanionPageId) {
		companionWorkbenchSettings.openPage(id);
		showPicker = false;
	}
</script>

<svelte:head>
	<title>Companion - Mana</title>
</svelte:head>

<PageCarousel
	pages={carouselPages}
	{showPicker}
	onTogglePicker={() => (showPicker = !showPicker)}
	addLabel="Page hinzufügen"
>
	{#snippet page(p)}
		{@const pageId = p.id as CompanionPageId}
		{@const idx = openPages.findIndex((o) => o.id === pageId)}
		{@const first = idx === 0}
		{@const last = idx === openPages.length - 1}
		{@const shellProps = {
			widthPx: p.widthPx,
			maximized: p.maximized,
			onClose: () => close(pageId),
			onMaximize: () => maximize(pageId),
			onResize: (w: number, h?: number) => resize(pageId, w, h),
			onMoveLeft: first ? undefined : () => moveLeft(pageId),
			onMoveRight: last ? undefined : () => moveRight(pageId),
		}}

		{#if pageId === 'home'}
			<AiHomePage {...shellProps} />
		{:else if pageId === 'chat'}
			<ChatPage {...shellProps} />
		{:else if pageId === 'missions'}
			<MissionsPage {...shellProps} />
		{:else if pageId === 'workbench'}
			<WorkbenchPage {...shellProps} />
		{:else if pageId === 'rituals'}
			<RitualsPage {...shellProps} />
		{:else if pageId === 'policy'}
			<PolicyPage {...shellProps} />
		{:else if pageId === 'insights'}
			<InsightsPage {...shellProps} />
		{:else if pageId === 'health'}
			<HealthPage {...shellProps} />
		{/if}
	{/snippet}

	{#snippet picker()}
		<PagePicker
			openIds={openPages.map((p) => p.id)}
			onPick={pick}
			onClose={() => (showPicker = false)}
		/>
	{/snippet}
</PageCarousel>
