<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { X } from '@mana/shared-icons';

	interface Props {
		onClose: () => void;
		onCreate: (data: { name: string; description?: string }) => void;
	}

	let { onClose, onCreate }: Props = $props();

	let name = $state('');
	let description = $state('');
	let loading = $state(false);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}

	function handleBackdropClick(e: Event) {
		if (e.target === e.currentTarget) onClose();
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim() || loading) return;

		loading = true;
		await onCreate({
			name: name.trim(),
			description: description.trim() || undefined,
		});
		loading = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	tabindex="-1"
	role="presentation"
>
	<div
		class="w-full max-w-md rounded-t-xl sm:rounded-xl border border-border bg-background-card p-6 max-h-[95vh] sm:max-h-[90vh]"
	>
		<header class="mb-6 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-foreground">Album erstellen</h2>
			<button
				class="rounded-full p-1 text-foreground-secondary hover:bg-background-card-hover"
				onclick={onClose}
				type="button"
			>
				<X size={20} />
			</button>
		</header>

		<form onsubmit={handleSubmit}>
			<div class="mb-4">
				<label for="name" class="mb-1 block text-sm font-medium text-foreground">Name</label>
				<input
					id="name"
					type="text"
					class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					bind:value={name}
					placeholder="Mein Album"
					required
				/>
			</div>

			<div class="mb-4">
				<label for="description" class="mb-1 block text-sm font-medium text-foreground"
					>Beschreibung</label
				>
				<textarea
					id="description"
					class="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					bind:value={description}
					placeholder="Optionale Beschreibung..."
					rows="3"
				></textarea>
			</div>

			<div class="flex justify-end gap-2">
				<button
					type="button"
					class="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground-secondary hover:bg-background-card-hover"
					onclick={onClose}
					disabled={loading}
				>
					{$_('common.cancel')}
				</button>
				<button
					type="submit"
					class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
					disabled={!name.trim() || loading}
				>
					{loading ? $_('common.creating') : $_('common.create')}
				</button>
			</div>
		</form>
	</div>
</div>
