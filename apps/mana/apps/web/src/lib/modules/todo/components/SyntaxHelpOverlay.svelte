<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X } from '@mana/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let sections = $derived([
		{
			title: $_('todo.syntaxHelp.date'),
			examples: [
				{ input: 'heute', desc: $_('todo.syntaxHelp.dateToday') },
				{ input: 'morgen', desc: $_('todo.syntaxHelp.dateTomorrow') },
				{ input: 'nächsten Montag', desc: $_('todo.syntaxHelp.dateNextWeekday') },
				{ input: '15.12.', desc: $_('todo.syntaxHelp.dateSpecific') },
			],
		},
		{
			title: $_('todo.syntaxHelp.time'),
			examples: [
				{ input: 'um 14 Uhr', desc: '14:00' },
				{ input: '14:30', desc: '14:30' },
			],
		},
		{
			title: $_('todo.syntaxHelp.priority'),
			examples: [
				{ input: '!dringend / !!!', desc: $_('todo.syntaxHelp.priorityUrgent') },
				{ input: '!hoch / !!', desc: $_('todo.syntaxHelp.priorityHigh') },
				{ input: '!niedrig / !', desc: $_('todo.syntaxHelp.priorityLow') },
			],
		},
		{
			title: $_('todo.syntaxHelp.labels'),
			examples: [{ input: '#wichtig #idee', desc: $_('todo.syntaxHelp.labelsAdd') }],
		},
		{
			title: $_('todo.syntaxHelp.duration'),
			examples: [
				{ input: '30min', desc: $_('todo.syntaxHelp.duration30m') },
				{ input: '2h', desc: $_('todo.syntaxHelp.duration2h') },
				{ input: '1.5 Stunden', desc: $_('todo.syntaxHelp.duration90m') },
			],
		},
		{
			title: $_('todo.syntaxHelp.recurrence'),
			examples: [
				{ input: 'jeden Tag', desc: $_('todo.syntaxHelp.recurrenceDaily') },
				{ input: 'wöchentlich', desc: $_('todo.syntaxHelp.recurrenceWeekly') },
				{ input: 'monatlich', desc: $_('todo.syntaxHelp.recurrenceMonthly') },
			],
		},
		{
			title: $_('todo.syntaxHelp.multiTask'),
			examples: [
				{ input: 'Task1, danach Task2', desc: $_('todo.syntaxHelp.multiTaskChain') },
				{ input: 'Task1; Task2; Task3', desc: $_('todo.syntaxHelp.multiTaskSemicolon') },
			],
		},
		{
			title: $_('todo.syntaxHelp.subtasks'),
			examples: [
				{ input: 'Einkaufen: Milch, Brot, Obst', desc: $_('todo.syntaxHelp.subtasksColonComma') },
			],
		},
	]);
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9996] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && onClose()}
	>
		<div
			class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-border px-5 py-3">
				<h2 class="text-lg font-semibold text-foreground">{$_('todo.syntaxHelp.title')}</h2>
				<button
					class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
					onclick={onClose}
				>
					<X size={18} />
				</button>
			</div>

			<div class="p-5">
				<p class="mb-4 text-sm text-muted-foreground">
					{$_('todo.syntaxHelp.description')}
				</p>

				<div class="space-y-4">
					{#each sections as section}
						<div>
							<h3 class="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
								{section.title}
							</h3>
							<div class="space-y-1">
								{#each section.examples as example}
									<div class="flex items-baseline gap-3 rounded-md px-2 py-1 hover:bg-muted/50">
										<code
											class="flex-shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-primary"
										>
											{example.input}
										</code>
										<span class="text-xs text-muted-foreground">{example.desc}</span>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<div class="mt-5 rounded-lg bg-muted/50 p-3">
					<p class="text-xs font-medium text-foreground">{$_('todo.syntaxHelp.exampleTitle')}</p>
					<code class="mt-1 block text-xs text-primary">
						{$_('todo.syntaxHelp.exampleInput')}
					</code>
					<p class="mt-1 text-xs text-muted-foreground">
						{$_('todo.syntaxHelp.exampleOutput')}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
