<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Skill } from '../types';
	import { LEVEL_NAMES } from '../types';
	import { X, Lightning, Clock, Star } from '@mana/shared-icons';

	interface Props {
		skill: Skill;
		onClose: () => void;
		onSave: (xp: number, description: string, duration?: number) => Promise<void>;
	}

	let { skill, onClose, onSave }: Props = $props();

	let xp = $state(10);
	let description = $state('');
	let duration = $state<number | undefined>(undefined);
	let saving = $state(false);

	// Quick XP presets
	const xpPresets = [
		{ label: '+5', value: 5, desc: 'Kurz geübt' },
		{ label: '+10', value: 10, desc: 'Normale Session' },
		{ label: '+25', value: 25, desc: 'Intensive Session' },
		{ label: '+50', value: 50, desc: 'Großer Fortschritt' },
		{ label: '+100', value: 100, desc: 'Meilenstein erreicht' },
	];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (xp <= 0) return;

		saving = true;
		try {
			await onSave(xp, description || `+${xp} XP`, duration);
		} finally {
			saving = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function selectPreset(preset: { value: number; desc: string }) {
		xp = preset.value;
		if (!description) {
			description = preset.desc;
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
			<div>
				<h2 class="text-xl font-bold text-white">XP hinzufügen</h2>
				<p class="text-sm text-muted-foreground">{skill.name} (Lvl {skill.level})</p>
			</div>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Quick XP Presets -->
			<div>
				<span class="mb-2 block text-sm font-medium text-foreground/90"> Schnellauswahl </span>
				<div class="flex flex-wrap gap-2">
					{#each xpPresets as preset}
						<button
							type="button"
							onclick={() => selectPreset(preset)}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors {xp ===
							preset.value
								? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
								: 'border-border bg-muted/50 text-foreground/90 hover:border-border-strong'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Custom XP -->
			<div>
				<label for="xp" class="mb-1 block text-sm font-medium text-foreground/90">
					<Lightning class="mr-1 inline h-4 w-4 text-yellow-500" />
					XP Menge
				</label>
				<input
					id="xp"
					type="number"
					bind:value={xp}
					min="1"
					max="1000"
					class="w-full rounded-lg border border-border bg-muted px-4 py-2 text-white placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="mb-1 block text-sm font-medium text-foreground/90">
					Was hast du gemacht?
				</label>
				<input
					id="description"
					type="text"
					bind:value={description}
					placeholder="z.B. Tutorial abgeschlossen"
					class="w-full rounded-lg border border-border bg-muted px-4 py-2 text-white placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Duration (optional) -->
			<div>
				<label for="duration" class="mb-1 block text-sm font-medium text-foreground/90">
					<Clock class="mr-1 inline h-4 w-4 text-muted-foreground" />
					Dauer (optional, Minuten)
				</label>
				<input
					id="duration"
					type="number"
					bind:value={duration}
					min="1"
					placeholder="z.B. 30"
					class="w-full rounded-lg border border-border bg-muted px-4 py-2 text-white placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Preview -->
			<div class="rounded-lg bg-muted/50 p-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Vorschau</span>
					<span class="font-medium text-emerald-400">+{xp} XP</span>
				</div>
				<div class="mt-1 text-xs text-muted-foreground">
					Neuer Stand: {(skill.totalXp + xp).toLocaleString()} XP
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-2">
				<button
					type="button"
					onclick={onClose}
					class="flex-1 rounded-lg border border-border bg-transparent px-4 py-2 font-medium text-foreground/90 transition-colors hover:bg-muted"
				>
					{$_('common.cancel')}
				</button>
				<button
					type="submit"
					disabled={xp <= 0 || saving}
					class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{saving ? $_('common.saving') : 'XP vergeben'}
				</button>
			</div>
		</form>
	</div>
</div>
