<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { exportApi, type ExportFormat } from '$lib/api/export';
	import { ContactsEvents } from '@manacore/shared-utils/analytics';

	interface Props {
		isOpen: boolean;
		selectedContactIds?: string[];
		onClose: () => void;
	}

	let { isOpen, selectedContactIds = [], onClose }: Props = $props();

	let format = $state<ExportFormat>('vcard');
	let includeArchived = $state(false);
	let isExporting = $state(false);
	let error = $state<string | null>(null);

	async function handleExport() {
		isExporting = true;
		error = null;

		try {
			await exportApi.exportContacts({
				format,
				contactIds: selectedContactIds.length > 0 ? selectedContactIds : undefined,
				includeArchived,
			});
			ContactsEvents.contactExported(format as 'csv' | 'vcard');
			onClose();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Export fehlgeschlagen';
		} finally {
			isExporting = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
		onclick={handleBackdropClick}
	>
		<div class="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-foreground">{$_('export.title')}</h2>
				<button
					type="button"
					onclick={onClose}
					class="text-muted-foreground hover:text-foreground transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Selection Info -->
			{#if selectedContactIds.length > 0}
				<div class="bg-primary/10 text-primary rounded-lg p-3 text-sm">
					{$_('export.selectedCount', { values: { count: selectedContactIds.length } })}
				</div>
			{:else}
				<p class="text-muted-foreground text-sm">{$_('export.allContacts')}</p>
			{/if}

			<!-- Error -->
			{#if error}
				<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
					{error}
				</div>
			{/if}

			<!-- Format Selection -->
			<div class="space-y-3">
				<label class="block text-sm font-medium text-foreground">{$_('export.format')}</label>
				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						onclick={() => (format = 'vcard')}
						class="p-4 rounded-lg border-2 transition-colors text-left
							{format === 'vcard'
							? 'border-primary bg-primary/10'
							: 'border-border hover:border-muted-foreground'}"
					>
						<div class="flex items-center gap-3">
							<svg
								class="w-8 h-8 text-primary"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
								/>
							</svg>
							<div>
								<div class="font-medium text-foreground">vCard</div>
								<div class="text-xs text-muted-foreground">.vcf</div>
							</div>
						</div>
					</button>
					<button
						type="button"
						onclick={() => (format = 'csv')}
						class="p-4 rounded-lg border-2 transition-colors text-left
							{format === 'csv' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}"
					>
						<div class="flex items-center gap-3">
							<svg
								class="w-8 h-8 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<div>
								<div class="font-medium text-foreground">CSV</div>
								<div class="text-xs text-muted-foreground">.csv</div>
							</div>
						</div>
					</button>
				</div>
			</div>

			<!-- Options -->
			<div class="space-y-3">
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						bind:checked={includeArchived}
						class="w-5 h-5 rounded border-border text-primary focus:ring-primary"
					/>
					<span class="text-sm text-foreground">{$_('export.includeArchived')}</span>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-2">
				<button type="button" onclick={onClose} class="btn btn-secondary">
					{$_('common.cancel')}
				</button>
				<button type="button" onclick={handleExport} disabled={isExporting} class="btn btn-primary">
					{#if isExporting}
						<span class="inline-flex items-center gap-2">
							<span
								class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
							></span>
							{$_('export.exporting')}
						</span>
					{:else}
						<span class="inline-flex items-center gap-2">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/>
							</svg>
							{$_('export.button')}
						</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
