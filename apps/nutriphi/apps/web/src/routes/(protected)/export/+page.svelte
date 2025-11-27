<script lang="ts">
	let dateFrom = $state('');
	let dateTo = $state('');
	let format = $state<'csv' | 'pdf'>('csv');
	let includeMeals = $state(true);
	let includeStats = $state(true);
	let includeGoals = $state(false);
	let isExporting = $state(false);

	// Set default date range (last 30 days)
	$effect(() => {
		if (!dateFrom && !dateTo) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today);
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

			dateTo = today.toISOString().split('T')[0];
			dateFrom = thirtyDaysAgo.toISOString().split('T')[0];
		}
	});

	async function handleExport() {
		if (!dateFrom || !dateTo) return;

		isExporting = true;

		try {
			// TODO: Implement actual export
			await new Promise((resolve) => setTimeout(resolve, 1500));

			// Create download link
			const blob = new Blob(['Export data'], {
				type: format === 'csv' ? 'text/csv' : 'application/pdf',
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `nutriphi-export-${dateFrom}-${dateTo}.${format}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			// Handle error
		} finally {
			isExporting = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daten exportieren</h1>
		<p class="text-gray-600 dark:text-gray-400">
			Exportiere deine Ernährungsdaten als CSV oder PDF
		</p>
	</div>

	<!-- Export Form -->
	<div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
		<!-- Date Range -->
		<div class="mb-6">
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Zeitraum</h2>
			<div class="grid gap-4 sm:grid-cols-2">
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Von
					</label>
					<input
						type="date"
						bind:value={dateFrom}
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Bis
					</label>
					<input
						type="date"
						bind:value={dateTo}
						class="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
		</div>

		<!-- Format Selection -->
		<div class="mb-6">
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Format</h2>
			<div class="grid grid-cols-2 gap-4">
				<button
					onclick={() => (format = 'csv')}
					class="rounded-xl border-2 p-4 text-center transition-colors {format === 'csv'
						? 'border-green-500 bg-green-50 dark:bg-green-900/20'
						: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
				>
					<div class="mb-2 text-3xl">📊</div>
					<p class="font-semibold text-gray-900 dark:text-white">CSV</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">Für Excel & Co.</p>
				</button>
				<button
					onclick={() => (format = 'pdf')}
					class="rounded-xl border-2 p-4 text-center transition-colors {format === 'pdf'
						? 'border-green-500 bg-green-50 dark:bg-green-900/20'
						: 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'}"
				>
					<div class="mb-2 text-3xl">📄</div>
					<p class="font-semibold text-gray-900 dark:text-white">PDF</p>
					<p class="text-sm text-gray-600 dark:text-gray-400">Mit Grafiken</p>
				</button>
			</div>
		</div>

		<!-- Content Selection -->
		<div class="mb-6">
			<h2 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Inhalt</h2>
			<div class="space-y-3">
				<label class="flex items-center gap-3">
					<input
						type="checkbox"
						bind:checked={includeMeals}
						class="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
					/>
					<div>
						<p class="font-medium text-gray-900 dark:text-white">Mahlzeiten</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Alle erfassten Mahlzeiten mit Nährwerten
						</p>
					</div>
				</label>
				<label class="flex items-center gap-3">
					<input
						type="checkbox"
						bind:checked={includeStats}
						class="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
					/>
					<div>
						<p class="font-medium text-gray-900 dark:text-white">Statistiken</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Tägliche Zusammenfassungen und Trends
						</p>
					</div>
				</label>
				<label class="flex items-center gap-3">
					<input
						type="checkbox"
						bind:checked={includeGoals}
						class="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
					/>
					<div>
						<p class="font-medium text-gray-900 dark:text-white">Ziele & Fortschritt</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Deine Ernährungsziele und deren Erreichung
						</p>
					</div>
				</label>
			</div>
		</div>

		<!-- Export Button -->
		<button
			onclick={handleExport}
			disabled={isExporting || !dateFrom || !dateTo}
			class="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{isExporting ? 'Wird exportiert...' : `Als ${format.toUpperCase()} exportieren`}
		</button>
	</div>

	<!-- Info -->
	<div class="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
		<p class="text-sm text-blue-700 dark:text-blue-400">
			<strong>Hinweis:</strong> Der Export enthält alle Daten im gewählten Zeitraum. CSV-Dateien können
			in Excel, Google Sheets oder ähnlichen Programmen geöffnet werden.
		</p>
	</div>
</div>
