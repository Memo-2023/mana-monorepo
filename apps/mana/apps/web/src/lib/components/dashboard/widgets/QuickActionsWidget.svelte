<script lang="ts">
	/**
	 * QuickActionsWidget - Quick action links (dashboard variant, i18n).
	 *
	 * Thin wrapper around <QuickActionsList>. Resolves i18n keys to literal
	 * strings before passing the actions array down.
	 */
	import { _ } from 'svelte-i18n';
	import QuickActionsList, { type QuickAction } from '$lib/components/QuickActionsList.svelte';

	const actions = [
		{
			href: '/credits',
			icon: '💰',
			labelKey: 'dashboard.widgets.quick_actions.credits',
			descKey: 'dashboard.widgets.quick_actions.credits_desc',
		},
		{
			href: '/feedback',
			icon: '💬',
			labelKey: 'dashboard.widgets.quick_actions.feedback',
			descKey: 'dashboard.widgets.quick_actions.feedback_desc',
		},
		{
			href: '/?app=profile',
			icon: '👤',
			labelKey: 'dashboard.widgets.quick_actions.profile',
			descKey: 'dashboard.widgets.quick_actions.profile_desc',
		},
	];

	let resolved = $derived<QuickAction[]>(
		actions.map((a) => ({
			href: a.href,
			icon: a.icon,
			label: $_(a.labelKey),
			description: $_(a.descKey),
		}))
	);
</script>

<QuickActionsList
	title={$_('dashboard.widgets.quick_actions.title')}
	titleIcon="⚡"
	actions={resolved}
/>
