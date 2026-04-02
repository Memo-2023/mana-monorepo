<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { LocalBoardView, ViewColumn, TaskMatcher } from '../../types';
	import { boardViewsStore } from '../../stores/board-views.svelte';
	import { X, Plus, Trash } from '@manacore/shared-icons';

	interface Props {
		view?: LocalBoardView | null;
		open: boolean;
		onClose: () => void;
	}

	let { view = null, open, onClose }: Props = $props();

	let name = $state('');
	let groupBy = $state<LocalBoardView['groupBy']>('status');
	let layout = $state<LocalBoardView['layout']>('kanban');
	let columns = $state<ViewColumn[]>([]);

	$effect(() => {
		if (open) {
			if (view) {
				name = view.name;
				groupBy = view.groupBy;
				layout = view.layout;
				columns = [...view.columns];
			} else {
				name = '';
				groupBy = 'status';
				layout = 'kanban';
				columns = [];
			}
		}
	});

	let GROUP_OPTIONS = $derived([
		{ value: 'status', label: $_('todo.board.groupStatus') },
		{ value: 'priority', label: $_('todo.board.groupPriority') },
		{ value: 'dueDate', label: $_('todo.board.groupDueDate') },
		{ value: 'tag', label: $_('todo.board.groupTag') },
		{ value: 'custom', label: $_('todo.board.groupCustom') },
	] as const);

	let LAYOUT_OPTIONS = $derived([
		{ value: 'kanban', label: $_('todo.board.layoutKanban') },
		{ value: 'grid', label: $_('todo.board.layoutGrid') },
		{ value: 'fokus', label: $_('todo.board.layoutFocus') },
	] as const);

	function addColumn() {
		columns = [
			...columns,
			{
				id: crypto.randomUUID(),
				name: `Spalte ${columns.length + 1}`,
				color: '#6B7280',
				match: { type: groupBy as TaskMatcher['type'], value: '' },
			},
		];
	}

	function removeColumn(id: string) {
		columns = columns.filter((c) => c.id !== id);
	}

	async function handleSave() {
		if (!name.trim()) return;
		if (view) {
			await boardViewsStore.updateView(view.id, {
				name: name.trim(),
				groupBy,
				layout,
				columns,
			});
		} else {
			await boardViewsStore.createView({
				name: name.trim(),
				icon: layout === 'kanban' ? 'columns' : layout === 'grid' ? 'grid' : 'target',
				groupBy,
				layout,
				columns,
				order: 0,
			});
		}
		onClose();
	}

	async function handleDelete() {
		if (view) {
			await boardViewsStore.deleteView(view.id);
			onClose();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9996] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && onClose()}
	>
		<div class="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-5 py-3">
				<h2 class="text-lg font-semibold text-foreground">
					{view ? $_('todo.board.edit') : $_('todo.board.new')}
				</h2>
				<button
					class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
					onclick={onClose}
				>
					<X size={18} />
				</button>
			</div>

			<!-- Form -->
			<div class="space-y-4 p-5">
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
					<input
						type="text"
						bind:value={name}
						placeholder={$_('todo.board.name')}
						class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="mb-1 block text-xs font-medium text-muted-foreground"
							>{$_('todo.board.groupBy')}</label
						>
						<select
							bind:value={groupBy}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
						>
							{#each GROUP_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="mb-1 block text-xs font-medium text-muted-foreground"
							>{$_('todo.board.layout')}</label
						>
						<select
							bind:value={layout}
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
						>
							{#each LAYOUT_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					</div>
				</div>

				<!-- Columns -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label class="text-xs font-medium text-muted-foreground"
							>{$_('todo.board.columns')}</label
						>
						<button
							onclick={addColumn}
							class="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10"
						>
							<Plus size={12} />
							{$_('todo.board.addColumn')}
						</button>
					</div>
					<div class="space-y-2">
						{#each columns as col, i (col.id)}
							<div class="flex items-center gap-2">
								<input
									type="color"
									bind:value={columns[i].color}
									class="h-8 w-8 cursor-pointer rounded border-none"
								/>
								<input
									type="text"
									bind:value={columns[i].name}
									placeholder={$_('todo.board.columnName')}
									class="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
								/>
								<button
									onclick={() => removeColumn(col.id)}
									class="text-muted-foreground hover:text-red-500"
								>
									<Trash size={14} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-between border-t border-border px-5 py-3">
				<div>
					{#if view}
						<button
							onclick={handleDelete}
							class="rounded-md px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
						>
							{$_('todo.board.delete')}
						</button>
					{/if}
				</div>
				<div class="flex gap-2">
					<button
						onclick={onClose}
						class="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
					>
						{$_('common.cancel')}
					</button>
					<button
						onclick={handleSave}
						disabled={!name.trim()}
						class="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-45"
					>
						{$_('common.save')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
