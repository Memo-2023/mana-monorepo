<script lang="ts">
	import {
		todoSettings,
		type KanbanCardSize,
		type LayoutMode,
	} from '$lib/modules/todo/stores/settings.svelte';
	import type { TaskPriority } from '$lib/modules/todo/types';
	import { ArrowLeft } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';
	import { _ } from 'svelte-i18n';

	function toggle(key: string) {
		todoSettings.update({ [key]: !todoSettings.settings[key] });
	}
</script>

<svelte:head>
	<title>{$_('todo.settings.pageTitle')}</title>
</svelte:head>

<RoutePage appId="todo" backHref="/todo">
	<div class="mx-auto max-w-2xl">
		<header class="mb-6 flex items-center gap-3">
			<a
				href="/todo"
				aria-label={$_('todo.settings.backAria')}
				class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				<ArrowLeft size={18} />
			</a>
			<h1 class="text-2xl font-bold text-foreground">{$_('todo.settings.title')}</h1>
		</header>

		<div class="space-y-6">
			<!-- Task Behavior -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.taskBehavior')}
				</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.defaultPriority')}</label>
						<select
							value={todoSettings.defaultPriority}
							onchange={(e) =>
								todoSettings.update({ defaultPriority: e.currentTarget.value as TaskPriority })}
							class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						>
							<option value="low">{$_('todo.priorityLow')}</option>
							<option value="medium">{$_('todo.priorityMedium')}</option>
							<option value="high">{$_('todo.priorityHigh')}</option>
							<option value="urgent">{$_('todo.priorityUrgent')}</option>
						</select>
					</div>

					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.defaultDueTime')}</label>
						<input
							type="time"
							value={todoSettings.settings.defaultDueTime ?? ''}
							onchange={(e) =>
								todoSettings.update({
									defaultDueTime: e.currentTarget.value || null,
								})}
							class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						/>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm text-foreground">{$_('todo.settings.autoArchive')}</label>
							<p class="text-xs text-muted-foreground">
								{$_('todo.settings.descAutoArchive')}
							</p>
						</div>
						<input
							type="number"
							min="0"
							placeholder="-"
							value={todoSettings.settings.autoArchiveCompletedDays ?? ''}
							onchange={(e) =>
								todoSettings.update({
									autoArchiveCompletedDays: e.currentTarget.value
										? Number(e.currentTarget.value)
										: null,
								})}
							class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						/>
					</div>
				</div>
			</section>

			<!-- View & Display -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.viewDisplay')}
				</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.defaultView')}</label>
						<select
							value={todoSettings.defaultView}
							onchange={(e) => todoSettings.update({ defaultView: e.currentTarget.value as any })}
							class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						>
							<option value="inbox">{$_('todo.settings.viewInbox')}</option>
							<option value="today">{$_('todo.settings.viewToday')}</option>
							<option value="upcoming">{$_('todo.settings.viewUpcoming')}</option>
							<option value="kanban">{$_('todo.settings.viewKanban')}</option>
						</select>
					</div>

					{#each [{ key: 'compactMode', label: $_('todo.settings.compactMode'), desc: $_('todo.settings.descCompactMode') }, { key: 'showTaskCounts', label: $_('todo.settings.showTaskCounts'), desc: $_('todo.settings.descShowTaskCounts') }, { key: 'showSubtaskProgress', label: $_('todo.settings.showSubtaskProgress'), desc: $_('todo.settings.descShowSubtaskProgress') }, { key: 'groupByProject', label: $_('todo.settings.groupByProject'), desc: $_('todo.settings.descGroupByProject') }] as toggle_item}
						<div class="flex items-center justify-between">
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<div>
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm text-foreground">{toggle_item.label}</label>
								<p class="text-xs text-muted-foreground">{toggle_item.desc}</p>
							</div>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								onclick={() => toggle(toggle_item.key)}
								class="relative h-6 w-11 rounded-full transition-colors {todoSettings.settings[
									toggle_item.key
								]
									? 'bg-primary'
									: 'bg-muted'}"
							>
								<span
									class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {todoSettings
										.settings[toggle_item.key]
										? 'translate-x-5'
										: 'translate-x-0.5'}"
								></span>
							</button>
						</div>
					{/each}
				</div>
			</section>

			<!-- Kanban Board -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.kanbanSettings')}
				</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.cardSize')}</label>
						<div class="flex gap-1">
							{#each ['compact', 'normal', 'large'] as const as size}
								<button
									onclick={() => todoSettings.update({ kanbanCardSize: size as KanbanCardSize })}
									class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors
									{todoSettings.kanbanCardSize === size
										? 'bg-primary/10 text-primary'
										: 'text-muted-foreground hover:bg-muted'}"
								>
									{size === 'compact'
										? $_('todo.settings.cardSizeCompact')
										: size === 'normal'
											? $_('todo.settings.cardSizeNormal')
											: $_('todo.settings.cardSizeLarge')}
								</button>
								// svelte-ignore a11y_consider_explicit_label
							{/each}
						</div>
					</div>

					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.showLabelsOnCards')}</label>
						<!-- svelte-ignore a11y_consider_explicit_label -->
						<button
							onclick={() => toggle('showLabelsOnCards')}
							class="relative h-6 w-11 rounded-full transition-colors {todoSettings.showLabelsOnCards
								? 'bg-primary'
								: 'bg-muted'}"
						>
							<span
								class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {todoSettings.showLabelsOnCards
									? 'translate-x-5'
									: 'translate-x-0.5'}"
							></span>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<div>
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm text-foreground">{$_('todo.settings.wipLimit')}</label>
							<p class="text-xs text-muted-foreground">{$_('todo.settings.descWipLimit')}</p>
						</div>
						<input
							type="number"
							min="0"
							placeholder="-"
							value={todoSettings.wipLimitPerColumn ?? ''}
							onchange={(e) =>
								todoSettings.update({
									wipLimitPerColumn: e.currentTarget.value ? Number(e.currentTarget.value) : null,
								})}
							class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						/>
					</div>
				</div>
			</section>

			<!-- Smart Duration -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.smartDuration')}
				</h2>
				<!-- svelte-ignore a11y_consider_explicit_label -->
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div>
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm text-foreground"
								>{$_('todo.settings.smartDurationEnabled')}</label
							>
							<p class="text-xs text-muted-foreground">
								{$_('todo.settings.descSmartDuration')}
							</p>
						</div>
						<button
							onclick={() => toggle('smartDurationEnabled')}
							class="relative h-6 w-11 rounded-full transition-colors {todoSettings.smartDurationEnabled
								? 'bg-primary'
								: 'bg-muted'}"
						>
							<span
								class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {todoSettings.smartDurationEnabled
									? 'translate-x-5'
									: 'translate-x-0.5'}"
							></span>
						</button>
					</div>

					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.defaultTaskDuration')}</label>
						<input
							type="number"
							min="5"
							step="5"
							value={todoSettings.defaultTaskDuration}
							onchange={(e) =>
								todoSettings.update({ defaultTaskDuration: Number(e.currentTarget.value) || 30 })}
							class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						/>
					</div>
				</div>
			</section>

			<!-- Notifications -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.notifications')}
				</h2>
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.defaultReminder')}</label>
						<select
							value={todoSettings.settings.defaultReminderMinutes ?? ''}
							onchange={(e) =>
								todoSettings.update({
									defaultReminderMinutes: e.currentTarget.value
										? Number(e.currentTarget.value)
										: null,
								})}
							class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						>
							<option value="">{$_('todo.settings.reminderNone')}</option>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<option value="5">{$_('todo.settings.reminder5')}</option>
							<option value="15">{$_('todo.settings.reminder15')}</option>
							<option value="30">{$_('todo.settings.reminder30')}</option>
							<option value="60">{$_('todo.settings.reminder1h')}</option>
							<option value="1440">{$_('todo.settings.reminder1d')}</option>
						</select>
					</div>

					{#each [{ key: 'dailyDigestEnabled', label: $_('todo.settings.dailyDigest') }, { key: 'overdueNotifications', label: $_('todo.settings.overdueNotifications') }] as item}
						<div class="flex items-center justify-between">
							<!-- svelte-ignore a11y_label_has_associated_control -->
							<label class="text-sm text-foreground">{item.label}</label>
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								onclick={() => toggle(item.key)}
								class="relative h-6 w-11 rounded-full transition-colors {todoSettings.settings[
									item.key
								]
									? 'bg-primary'
									: 'bg-muted'}"
							>
								<span
									class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {todoSettings
										.settings[item.key]
										? 'translate-x-5'
										: 'translate-x-0.5'}"
								></span>
							</button>
						</div>
					{/each}
				</div>
			</section>

			<!-- svelte-ignore a11y_consider_explicit_label -->
			<!-- Productivity -->
			<section class="rounded-xl border border-border bg-card p-5">
				<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
					{$_('todo.settings.productivity')}
				</h2>
				<div class="space-y-4">
					{#each [{ key: 'focusMode', label: $_('todo.settings.focusMode'), desc: $_('todo.settings.descFocusMode') }, { key: 'pomodoroEnabled', label: $_('todo.settings.pomodoro'), desc: $_('todo.settings.descPomodoro') }, { key: 'showStreak', label: $_('todo.settings.showStreak'), desc: $_('todo.settings.descShowStreak') }, { key: 'immersiveModeEnabled', label: $_('todo.settings.immersiveMode'), desc: $_('todo.settings.descImmersiveMode') }] as item}
						<div class="flex items-center justify-between">
							<div>
								<!-- svelte-ignore a11y_label_has_associated_control -->
								<label class="text-sm text-foreground">{item.label}</label>
								<p class="text-xs text-muted-foreground">{item.desc}</p>
							</div>
							<button
								onclick={() => toggle(item.key)}
								class="relative h-6 w-11 rounded-full transition-colors {todoSettings.settings[
									item.key
								]
									? 'bg-primary'
									: 'bg-muted'}"
							>
								<span
									class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform {todoSettings
										.settings[item.key]
										? 'translate-x-5'
										: 'translate-x-0.5'}"
								></span>
							</button>
						</div>
					{/each}

					<div class="flex items-center justify-between">
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">{$_('todo.settings.dailyGoal')}</label>
						<input
							type="number"
							min="0"
							placeholder="-"
							value={todoSettings.settings.dailyGoal ?? ''}
							onchange={(e) =>
								todoSettings.update({
									dailyGoal: e.currentTarget.value ? Number(e.currentTarget.value) : null,
								})}
							class="w-20 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
						/>
					</div>
				</div>
			</section>

			<!-- Reset -->
			<div class="flex justify-end pb-8">
				<button
					onclick={() => {
						if (confirm($_('todo.settings.confirmReset'))) {
							todoSettings.reset();
						}
					}}
					class="rounded-md px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
				>
					{$_('todo.settings.reset')}
				</button>
			</div>
		</div>
	</div>
</RoutePage>
