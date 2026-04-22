<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Skill, SkillBranch } from '../types';
	import { BRANCH_INFO } from '../types';
	import { X } from '@mana/shared-icons';

	interface Props {
		onClose: () => void;
		onSave: (skill: Partial<Skill>) => Promise<void>;
	}

	let { onClose, onSave }: Props = $props();

	let name = $state('');
	let description = $state('');
	let branch = $state<SkillBranch>('intellect');
	let saving = $state(false);

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
		} finally {
			saving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
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
			<h2 class="text-xl font-bold text-white">Neuer Skill</h2>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Name -->
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-foreground/90"> Name * </label>
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
				<label for="branch" class="mb-2 block text-sm font-medium text-foreground/90">
					Kategorie
				</label>
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

			<!-- Actions -->
			<div class="flex gap-3 pt-4">
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
					{saving ? $_('common.saving') : $_('common.create')}
				</button>
			</div>
		</form>
	</div>
</div>
