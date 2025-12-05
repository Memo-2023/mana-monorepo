<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X, Plus, Trash } from '@manacore/shared-icons';
	import type { Mood, AnimationType } from '$lib/types/mood';
	import { ANIMATIONS } from '$lib/types/mood';
	import { getMoodGradient } from '$lib/data/default-moods';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onSave: (mood: Omit<Mood, 'id' | 'isCustom' | 'order' | 'createdAt'>) => void;
		editMood?: Mood | null;
	}

	let { isOpen, onClose, onSave, editMood = null }: Props = $props();

	let name = $state('');
	let colors = $state<string[]>(['#667eea', '#764ba2']);
	let animationType = $state<AnimationType>('gradient');

	// Preview mood
	let previewMood = $derived<Mood>({
		id: 'preview',
		name: name || 'Preview',
		colors,
		animationType,
	});

	// Reset form when dialog opens/closes or when editing different mood
	$effect(() => {
		if (isOpen) {
			if (editMood) {
				name = editMood.name;
				colors = [...editMood.colors];
				animationType = editMood.animationType;
			} else {
				name = '';
				colors = ['#667eea', '#764ba2'];
				animationType = 'gradient';
			}
		}
	});

	function addColor() {
		if (colors.length < 8) {
			// Generate a random color
			const randomColor =
				'#' +
				Math.floor(Math.random() * 16777215)
					.toString(16)
					.padStart(6, '0');
			colors = [...colors, randomColor];
		}
	}

	function removeColor(index: number) {
		if (colors.length > 1) {
			colors = colors.filter((_, i) => i !== index);
		}
	}

	function updateColor(index: number, value: string) {
		colors = colors.map((c, i) => (i === index ? value : c));
	}

	function handleSubmit() {
		if (!name.trim()) return;
		if (colors.length === 0) return;

		onSave({
			name: name.trim(),
			colors,
			animationType,
		});

		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
		onclick={onClose}
		role="presentation"
	></div>

	<!-- Dialog -->
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
		<div
			class="bg-[hsl(var(--color-background))] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
			role="dialog"
			aria-modal="true"
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h2 class="text-xl font-semibold">
					{editMood ? $_('createMood.editTitle') : $_('createMood.title')}
				</h2>
				<button
					type="button"
					class="p-2 rounded-lg hover:bg-muted transition-colors"
					onclick={onClose}
					aria-label="Close"
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-4 space-y-6">
				<!-- Preview -->
				<div class="relative rounded-xl overflow-hidden aspect-video">
					<div class="absolute inset-0" style="background: {getMoodGradient(previewMood)};"></div>
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
					></div>
					<div class="absolute inset-x-0 bottom-0 p-4">
						<h3 class="text-lg font-semibold text-white drop-shadow-md">
							{previewMood.name}
						</h3>
						<p class="text-sm text-white/70 capitalize">{previewMood.animationType}</p>
					</div>
				</div>

				<!-- Name Input -->
				<div class="space-y-2">
					<label for="mood-name" class="text-sm font-medium">
						{$_('createMood.name')}
					</label>
					<input
						id="mood-name"
						type="text"
						bind:value={name}
						placeholder={$_('createMood.namePlaceholder')}
						class="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
					/>
				</div>

				<!-- Colors -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium">{$_('createMood.colors')}</label>
						<button
							type="button"
							class="flex items-center gap-1 px-2 py-1 text-sm rounded-lg hover:bg-muted transition-colors"
							onclick={addColor}
							disabled={colors.length >= 8}
						>
							<Plus size={16} />
							{$_('createMood.addColor')}
						</button>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each colors as color, i}
							<div class="flex items-center gap-1">
								<input
									type="color"
									value={color}
									onchange={(e) => updateColor(i, e.currentTarget.value)}
									class="w-10 h-10 rounded-lg border border-border cursor-pointer"
								/>
								{#if colors.length > 1}
									<button
										type="button"
										class="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
										onclick={() => removeColor(i)}
										aria-label="Remove color"
									>
										<Trash size={16} />
									</button>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<!-- Animation Type -->
				<div class="space-y-2">
					<label for="animation-type" class="text-sm font-medium">
						{$_('createMood.animation')}
					</label>
					<select
						id="animation-type"
						bind:value={animationType}
						class="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
					>
						{#each ANIMATIONS as anim}
							<option value={anim.id}>{anim.name} - {anim.description}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-4 border-t border-border">
				<button
					type="button"
					class="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
					onclick={onClose}
				>
					{$_('common.cancel')}
				</button>
				<button
					type="button"
					class="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					onclick={handleSubmit}
					disabled={!name.trim() || colors.length === 0}
				>
					{$_('common.save')}
				</button>
			</div>
		</div>
	</div>
{/if}
