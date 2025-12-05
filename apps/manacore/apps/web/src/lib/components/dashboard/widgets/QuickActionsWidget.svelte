<script lang="ts">
	/**
	 * QuickActionsWidget - Quick action links
	 */

	import { _ } from 'svelte-i18n';

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
			href: '/profile',
			icon: '👤',
			labelKey: 'dashboard.widgets.quick_actions.profile',
			descKey: 'dashboard.widgets.quick_actions.profile_desc',
		},
	];
</script>

<div>
	<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
		<span>⚡</span>
		{$_('dashboard.widgets.quick_actions.title')}
	</h3>

	<div class="space-y-2">
		{#each actions as action}
			<a href={action.href} class="block rounded-lg p-3 transition-colors hover:bg-surface-hover">
				<div class="flex items-center">
					<span class="text-2xl">{action.icon}</span>
					<div class="ml-3">
						<p class="font-medium">{$_(action.labelKey)}</p>
						<p class="text-sm text-muted-foreground">{$_(action.descKey)}</p>
					</div>
				</div>
			</a>
		{/each}
	</div>
</div>
