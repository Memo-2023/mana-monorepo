<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { PageHeader, Button } from '@manacore/shared-ui';
	import { authStore } from '$lib/stores';
	import { getDownloadUrl } from '$lib/api';

	let fileInput: HTMLInputElement;
	let importing = $state(false);
	let result = $state<{ imported: number; errors: number } | null>(null);
	let error = $state<string | null>(null);

	async function handleImport(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.files?.length) return;

		importing = true;
		error = null;
		result = null;

		const formData = new FormData();
		formData.append('file', input.files[0]);

		try {
			const token = await authStore.getAccessToken();
			const response = await fetch(getDownloadUrl('/api/v1/import/csv'), {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData,
			});

			if (!response.ok) {
				throw new Error('Import failed');
			}

			result = await response.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Import failed';
		} finally {
			importing = false;
			input.value = '';
		}
	}

	function downloadTemplate() {
		window.open(getDownloadUrl('/api/v1/import/template'), '_blank');
	}
</script>

<svelte:head>
	<title>{$_('import.title')} - {$_('app.name')}</title>
</svelte:head>

<div class="p-6 max-w-2xl mx-auto">
	<PageHeader title={$_('import.title')} />

	<div class="mt-6 space-y-6">
		<!-- CSV Import -->
		<div class="p-6 rounded-xl border border-theme bg-surface">
			<h3 class="font-medium text-theme mb-4">{$_('import.csv')}</h3>

			<input
				bind:this={fileInput}
				type="file"
				accept=".csv"
				class="hidden"
				onchange={handleImport}
			/>

			<div class="space-y-4">
				<Button onclick={downloadTemplate} variant="outline">
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
						/>
					</svg>
					{$_('import.template')}
				</Button>

				<div class="border-2 border-dashed border-theme rounded-xl p-8 text-center">
					<svg
						class="w-12 h-12 mx-auto text-theme-secondary mb-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
						/>
					</svg>

					<Button onclick={() => fileInput.click()} disabled={importing}>
						{importing ? $_('common.loading') : $_('import.selectFile')}
					</Button>
				</div>

				{#if result}
					<div class="p-4 rounded-lg bg-green-500/10 text-green-600">
						<p class="font-medium">{$_('import.success')}</p>
						<p class="text-sm">{$_('import.imported', { values: { count: result.imported } })}</p>
						{#if result.errors > 0}
							<p class="text-sm text-yellow-600">{result.errors} Fehler</p>
						{/if}
					</div>
				{/if}

				{#if error}
					<div class="p-4 rounded-lg bg-red-500/10 text-red-500">
						{error}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
