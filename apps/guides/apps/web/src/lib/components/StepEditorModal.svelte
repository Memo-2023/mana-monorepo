<script lang="ts">
	import type { LocalStep, StepType } from '$lib/data/local-store.js';
	import type { BaseRecord } from '@manacore/local-store';

	type StepInput = Omit<LocalStep, keyof BaseRecord>;

	interface Props {
		open: boolean;
		step?: LocalStep;
		guideId: string;
		sectionId?: string;
		order: number;
		onClose: () => void;
		onSave: (data: StepInput) => Promise<void>;
	}

	let { open, step, guideId, sectionId, order, onClose, onSave }: Props = $props();

	let title = $state(step?.title ?? '');
	let content = $state(step?.content ?? '');
	let type = $state<StepType>(step?.type ?? 'instruction');
	let checkable = $state(step?.checkable ?? true);
	let saving = $state(false);

	$effect(() => {
		if (step) {
			title = step.title;
			content = step.content ?? '';
			type = step.type;
			checkable = step.checkable;
		} else {
			title = '';
			content = '';
			type = 'instruction';
			checkable = true;
		}
	});

	const STEP_TYPES: { value: StepType; label: string; icon: string; description: string }[] = [
		{ value: 'instruction', label: 'Anweisung', icon: '→', description: 'Normaler Schritt' },
		{ value: 'warning', label: 'Warnung', icon: '⚠', description: 'Wichtiger Hinweis' },
		{ value: 'tip', label: 'Tipp', icon: '💡', description: 'Hilfreicher Hinweis' },
		{ value: 'checkpoint', label: 'Checkpoint', icon: '✓', description: 'Überprüfungspunkt' },
		{ value: 'code', label: 'Code', icon: '</>', description: 'Code-Block (Markdown)' },
	];

	async function handleSave() {
		if (!title.trim()) return;
		saving = true;
		try {
			await onSave({ title: title.trim(), content: content.trim() || undefined, type, checkable, guideId, sectionId, order });
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleSave();
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
		onmousedown={handleBackdrop}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={step ? 'Schritt bearbeiten' : 'Neuer Schritt'}
			class="w-full max-w-lg overflow-hidden rounded-t-2xl bg-background shadow-xl sm:rounded-2xl"
			onkeydown={handleKeydown}
		>
			<div class="flex items-center justify-between border-b border-border px-5 py-4">
				<h2 class="font-semibold text-foreground">{step ? 'Schritt bearbeiten' : 'Neuer Schritt'}</h2>
				<button onclick={onClose} class="text-muted-foreground hover:text-foreground">✕</button>
			</div>

			<div class="max-h-[75vh] overflow-y-auto p-5 space-y-4">
				<!-- Step type selector -->
				<div>
					<label class="mb-2 block text-xs font-medium text-muted-foreground">Typ</label>
					<div class="grid grid-cols-5 gap-1.5">
						{#each STEP_TYPES as t}
							<button
								onclick={() => (type = t.value)}
								title={t.description}
								class="flex flex-col items-center gap-1 rounded-xl border py-2.5 text-center transition-colors
								{type === t.value
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border text-muted-foreground hover:bg-accent'}"
							>
								<span class="text-base">{t.icon}</span>
								<span class="text-[10px] leading-tight">{t.label}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Title -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">Schritt-Titel *</label>
					<input
						type="text"
						bind:value={title}
						placeholder="z.B. npm install ausführen"
						autofocus
						class="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
				</div>

				<!-- Content -->
				<div>
					<label class="mb-1 block text-xs font-medium text-muted-foreground">
						Beschreibung / Inhalt
						{#if type === 'code'}
							<span class="font-normal">(Markdown · ```bash ... ``` für Code-Blöcke)</span>
						{/if}
					</label>
					<textarea
						bind:value={content}
						placeholder={type === 'code'
							? '```bash\nnpm install\nnpm run dev\n```'
							: 'Optionale Beschreibung oder Details...'}
						rows={type === 'code' ? 5 : 3}
						class="w-full resize-y rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
					></textarea>
				</div>

				<!-- Checkable toggle -->
				<label class="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-surface px-4 py-3">
					<div>
						<p class="text-sm font-medium text-foreground">Abhakbar</p>
						<p class="text-xs text-muted-foreground">Schritt kann im Run-Modus abgehakt werden</p>
					</div>
					<div
						class="relative h-5 w-9 rounded-full transition-colors {checkable ? 'bg-primary' : 'bg-muted'}"
						onclick={() => (checkable = !checkable)}
						role="switch"
						aria-checked={checkable}
						tabindex="0"
					>
						<span
							class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform {checkable ? 'translate-x-4' : 'translate-x-0.5'}"
						></span>
					</div>
				</label>
			</div>

			<div class="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
				<button onclick={onClose} class="rounded-xl border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">
					Abbrechen
				</button>
				<button
					onclick={handleSave}
					disabled={!title.trim() || saving}
					class="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
				>
					{saving ? 'Speichern...' : step ? 'Speichern' : 'Hinzufügen'}
				</button>
			</div>
		</div>
	</div>
{/if}
