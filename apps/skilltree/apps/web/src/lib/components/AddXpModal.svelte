<script lang="ts">
	import type { Skill } from '$lib/types';
	import { LEVEL_NAMES } from '$lib/types';
	import { X, Lightning, Clock, Star } from '@manacore/shared-icons';

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
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
>
	<div class="mx-4 w-full max-w-md rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h2 class="text-xl font-bold text-white">XP hinzufügen</h2>
				<p class="text-sm text-gray-400">{skill.name} (Lvl {skill.level})</p>
			</div>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Quick XP Presets -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-300"> Schnellauswahl </label>
				<div class="flex flex-wrap gap-2">
					{#each xpPresets as preset}
						<button
							type="button"
							onclick={() => selectPreset(preset)}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors {xp ===
							preset.value
								? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
								: 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'}"
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Custom XP -->
			<div>
				<label for="xp" class="mb-1 block text-sm font-medium text-gray-300">
					<Lightning class="mr-1 inline h-4 w-4 text-yellow-500" />
					XP Menge
				</label>
				<input
					id="xp"
					type="number"
					bind:value={xp}
					min="1"
					max="1000"
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="mb-1 block text-sm font-medium text-gray-300">
					Was hast du gemacht?
				</label>
				<input
					id="description"
					type="text"
					bind:value={description}
					placeholder="z.B. Tutorial abgeschlossen"
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Duration (optional) -->
			<div>
				<label for="duration" class="mb-1 block text-sm font-medium text-gray-300">
					<Clock class="mr-1 inline h-4 w-4 text-gray-400" />
					Dauer (optional, Minuten)
				</label>
				<input
					id="duration"
					type="number"
					bind:value={duration}
					min="1"
					placeholder="z.B. 30"
					class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
				/>
			</div>

			<!-- Preview -->
			<div class="rounded-lg bg-gray-700/50 p-3">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-400">Vorschau</span>
					<span class="font-medium text-emerald-400">+{xp} XP</span>
				</div>
				<div class="mt-1 text-xs text-gray-500">
					Neuer Stand: {(skill.totalXp + xp).toLocaleString()} XP
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-2">
				<button
					type="button"
					onclick={onClose}
					class="flex-1 rounded-lg border border-gray-600 bg-transparent px-4 py-2 font-medium text-gray-300 transition-colors hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					type="submit"
					disabled={xp <= 0 || saving}
					class="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{saving ? 'Speichern...' : 'XP vergeben'}
				</button>
			</div>
		</form>
	</div>
</div>
