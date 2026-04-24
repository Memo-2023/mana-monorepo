<script lang="ts">
	import { formatDate } from '$lib/i18n/format';
	import { _ } from 'svelte-i18n';
	import type { Skill, SkillBranch } from '../types';
	import { BRANCH_INFO } from '../types';
	import { X, Trash } from '@mana/shared-icons';

	interface Props {
		skill: Skill;
		onClose: () => void;
		onSave: (updates: Partial<Skill>) => Promise<void>;
		onDelete: () => void;
	}

	let { skill, onClose, onSave, onDelete }: Props = $props();

	// svelte-ignore state_referenced_locally
	let name = $state(skill.name);
	// svelte-ignore state_referenced_locally
	let description = $state(skill.description);
	// svelte-ignore state_referenced_locally
	let branch = $state<SkillBranch>(skill.branch);
	let saving = $state(false);
	let showDeleteConfirm = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;

		saving = true;
		try {
			await onSave({
				name: name.trim(),
				description: description.trim(),
				branch,
			});
			onClose();
		} finally {
			saving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function confirmDelete() {
		onDelete();
		onClose();
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
	role="dialog"
	aria-modal="true"
>
	<div
		class="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-xl max-h-[95vh] sm:max-h-[90vh] sm:mx-4"
	>
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-xl font-bold text-white">Skill bearbeiten</h2>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		{#if showDeleteConfirm}
			<!-- Delete Confirmation -->
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20"
				>
					<Trash class="h-8 w-8 text-red-500" />
				</div>
				<h3 class="mb-2 text-lg font-semibold text-white">Skill löschen?</h3>
				<p class="mb-6 text-muted-foreground">
					"{skill.name}" und alle zugehörigen Aktivitäten werden unwiderruflich gelöscht.
				</p>
				<div class="flex gap-3">
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 font-medium text-foreground/90 transition-colors hover:bg-muted"
					>
						{$_('common.cancel')}
					</button>
					<button
						onclick={confirmDelete}
						class="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-500"
					>
						{$_('common.delete')}
					</button>
				</div>
			</div>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Name -->
				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-foreground/90">
						Name *
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						placeholder="z.B. TypeScript"
						class="w-full rounded-lg border border-border bg-muted px-4 py-2 text-white placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
						required
					/>
				</div>

				<!-- Description -->
				<div>
					<label for="description" class="mb-1 block text-sm font-medium text-foreground/90">
						Beschreibung
					</label>
					<textarea
						id="description"
						bind:value={description}
						placeholder="Worum geht es bei diesem Skill?"
						rows="3"
						class="w-full rounded-lg border border-border bg-muted px-4 py-2 text-white placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
					></textarea>
				</div>

				<!-- Branch -->
				<div>
					<span class="mb-2 block text-sm font-medium text-foreground/90"> Kategorie </span>
					<div class="grid grid-cols-2 gap-2">
						{#each Object.entries(BRANCH_INFO) as [key, info]}
							<button
								type="button"
								onclick={() => (branch = key as SkillBranch)}
								class="flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors {branch ===
								key
									? 'border-emerald-500 bg-emerald-500/20 text-white'
									: 'border-border bg-muted/50 text-foreground/90 hover:border-border-strong'}"
							>
								<span class="h-3 w-3 rounded-full" style="background-color: {info.color}"></span>
								{info.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Stats (read-only) -->
				<div class="rounded-lg bg-muted/50 p-3">
					<div class="grid grid-cols-3 gap-4 text-center text-sm">
						<div>
							<div class="text-muted-foreground">Level</div>
							<div class="font-semibold text-white">{skill.level}</div>
						</div>
						<div>
							<div class="text-muted-foreground">Total XP</div>
							<div class="font-semibold text-white">{skill.totalXp.toLocaleString()}</div>
						</div>
						<div>
							<div class="text-muted-foreground">Erstellt</div>
							<div class="font-semibold text-white">
								{formatDate(new Date(skill.createdAt))}
							</div>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-3 pt-4">
					<button
						type="button"
						onclick={() => (showDeleteConfirm = true)}
						class="rounded-lg bg-red-600/20 p-2 text-red-400 transition-colors hover:bg-red-600/30"
						title={$_('common.delete')}
					>
						<Trash class="h-5 w-5" />
					</button>
					<button
						type="button"
						onclick={onClose}
						class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 font-medium text-foreground/90 transition-colors hover:bg-muted"
					>
						{$_('common.cancel')}
					</button>
					<button
						type="submit"
						disabled={!name.trim() || saving}
						class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? $_('common.saving') : $_('common.save')}
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>
