<script lang="ts">
	import {
		todoSettings,
		type KanbanCardSize,
		type LayoutMode,
	} from '$lib/modules/todo/stores/settings.svelte';
	import type { TaskPriority } from '$lib/modules/todo/types';
	import { ArrowLeft } from '@mana/shared-icons';

	function toggle(key: string) {
		todoSettings.update({ [key]: !todoSettings.settings[key] });
	}
</script>

<svelte:head>
	<title>Todo Einstellungen - Mana</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<header class="mb-6 flex items-center gap-3">
		<a
			href="/todo"
			class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
		>
			<ArrowLeft size={18} />
		</a>
		<h1 class="text-2xl font-bold text-foreground">Todo Einstellungen</h1>
	</header>

	<div class="space-y-6">
		<!-- Task Behavior -->
		<section class="rounded-xl border border-border bg-card p-5">
			<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				Aufgaben-Verhalten
			</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Standard-Priorität</label>
					<select
						value={todoSettings.defaultPriority}
						onchange={(e) =>
							todoSettings.update({ defaultPriority: e.currentTarget.value as TaskPriority })}
						class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
					>
						<option value="low">Niedrig</option>
						<option value="medium">Mittel</option>
						<option value="high">Hoch</option>
						<option value="urgent">Dringend</option>
					</select>
				</div>

				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Standard-Fälligkeitszeit</label>
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
						<label class="text-sm text-foreground">Auto-Archivierung</label>
						<p class="text-xs text-muted-foreground">Erledigte Aufgaben nach X Tagen archivieren</p>
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
				Ansicht & Darstellung
			</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Standard-Ansicht</label>
					<select
						value={todoSettings.defaultView}
						onchange={(e) => todoSettings.update({ defaultView: e.currentTarget.value as any })}
						class="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
					>
						<option value="inbox">Inbox</option>
						<option value="today">Heute</option>
						<option value="upcoming">Anstehend</option>
						<option value="kanban">Kanban</option>
					</select>
				</div>

				{#each [{ key: 'compactMode', label: 'Kompaktmodus', desc: 'Weniger Abstand zwischen Aufgaben' }, { key: 'showTaskCounts', label: 'Aufgabenzahl', desc: 'Anzahl der Aufgaben anzeigen' }, { key: 'showSubtaskProgress', label: 'Teilaufgaben-Fortschritt', desc: 'Fortschritt der Subtasks anzeigen' }, { key: 'groupByProject', label: 'Nach Projekt gruppieren', desc: 'Aufgaben nach Projekt gruppieren' }] as toggle_item}
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
				Kanban Board
			</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Kartengröße</label>
					<div class="flex gap-1">
						{#each ['compact', 'normal', 'large'] as size}
							<button
								onclick={() => todoSettings.update({ kanbanCardSize: size as KanbanCardSize })}
								class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors
									{todoSettings.kanbanCardSize === size
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:bg-muted'}"
							>
								{size === 'compact' ? 'Kompakt' : size === 'normal' ? 'Normal' : 'Groß'}
							</button>
							// svelte-ignore a11y_consider_explicit_label
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Labels auf Karten</label>
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
						<label class="text-sm text-foreground">WIP-Limit pro Spalte</label>
						<p class="text-xs text-muted-foreground">Maximum Aufgaben pro Spalte</p>
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
				Smarte Dauer
			</h2>
			<!-- svelte-ignore a11y_consider_explicit_label -->
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<div>
						<!-- svelte-ignore a11y_label_has_associated_control -->
						<label class="text-sm text-foreground">Smarte Dauer-Schätzung</label>
						<p class="text-xs text-muted-foreground">
							Dauer automatisch basierend auf ähnlichen Aufgaben schätzen
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
					<label class="text-sm text-foreground">Standard-Dauer (Minuten)</label>
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
				Benachrichtigungen
			</h2>
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="text-sm text-foreground">Standard-Erinnerung</label>
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
						<option value="">Keine</option>
						<!-- svelte-ignore a11y_consider_explicit_label -->
						<option value="5">5 Min</option>
						<option value="15">15 Min</option>
						<option value="30">30 Min</option>
						<option value="60">1 Std</option>
						<option value="1440">1 Tag</option>
					</select>
				</div>

				{#each [{ key: 'dailyDigestEnabled', label: 'Tägliche Zusammenfassung' }, { key: 'overdueNotifications', label: 'Überfällig-Benachrichtigungen' }] as item}
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
				Produktivität
			</h2>
			<div class="space-y-4">
				{#each [{ key: 'focusMode', label: 'Fokus-Modus', desc: 'Ablenkungen minimieren' }, { key: 'pomodoroEnabled', label: 'Pomodoro', desc: 'Pomodoro-Timer integrieren' }, { key: 'showStreak', label: 'Streak anzeigen', desc: 'Tägliche Erledigungsserie' }, { key: 'immersiveModeEnabled', label: 'Immersiver Modus', desc: 'Navigation ausblenden' }] as item}
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
					<label class="text-sm text-foreground">Tagesziel (Aufgaben)</label>
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
					if (confirm('Alle Todo-Einstellungen zurücksetzen?')) {
						todoSettings.reset();
					}
				}}
				class="rounded-md px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-500/10"
			>
				Einstellungen zurücksetzen
			</button>
		</div>
	</div>
</div>
