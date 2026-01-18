<script lang="ts">
	import { goto } from '$app/navigation';
	import { photosApi } from '$lib/api/photos';
	import { analysisApi } from '$lib/api/analysis';
	import { plantsApi } from '$lib/api/plants';
	import type { PlantPhoto, PlantAnalysis } from '@planta/shared';

	let step = $state<'upload' | 'analyzing' | 'result'>('upload');
	let dragover = $state(false);
	let photo = $state<PlantPhoto | null>(null);
	let analysis = $state<PlantAnalysis | null>(null);
	let plantName = $state('');
	let error = $state('');
	let saving = $state(false);

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragover = true;
	}

	function handleDragLeave() {
		dragover = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragover = false;

		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			await uploadFile(files[0]);
		}
	}

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			await uploadFile(input.files[0]);
		}
	}

	async function uploadFile(file: File) {
		if (!file.type.startsWith('image/')) {
			error = 'Bitte wähle ein Bild aus';
			return;
		}

		error = '';
		step = 'analyzing';

		// Upload photo
		const uploadedPhoto = await photosApi.upload(file);
		if (!uploadedPhoto) {
			error = 'Foto konnte nicht hochgeladen werden';
			step = 'upload';
			return;
		}

		photo = uploadedPhoto;

		// Analyze with AI
		const analysisResult = await analysisApi.analyze(uploadedPhoto.id);
		if (!analysisResult) {
			error = 'Analyse fehlgeschlagen. Bitte versuche es erneut.';
			step = 'upload';
			return;
		}

		analysis = analysisResult;

		// Set default plant name from analysis
		if (analysisResult.commonNames && analysisResult.commonNames.length > 0) {
			plantName = analysisResult.commonNames[0];
		} else if (analysisResult.scientificName) {
			plantName = analysisResult.scientificName;
		}

		step = 'result';
	}

	async function savePlant() {
		if (!plantName.trim()) {
			error = 'Bitte gib einen Namen für die Pflanze ein';
			return;
		}

		if (!photo || !analysis) {
			error = 'Keine Analyse vorhanden';
			return;
		}

		saving = true;
		error = '';

		// Create plant
		const plant = await plantsApi.create({
			name: plantName.trim(),
			scientificName: analysis.scientificName || undefined,
			commonName: analysis.commonNames?.[0] || undefined,
		});

		if (!plant) {
			error = 'Pflanze konnte nicht gespeichert werden';
			saving = false;
			return;
		}

		// Navigate to plant detail
		goto(`/plants/${plant.id}`);
	}

	function getHealthBadgeClass(status: string | null | undefined): string {
		if (!status) return 'healthy';
		if (status === 'minor_issues' || status === 'needs_care') return 'needs_attention';
		if (status === 'critical') return 'sick';
		return 'healthy';
	}

	function getHealthText(status: string | null | undefined): string {
		const map: Record<string, string> = {
			healthy: 'Gesund',
			minor_issues: 'Kleine Probleme',
			needs_care: 'Braucht Pflege',
			critical: 'Kritisch',
		};
		return map[status || ''] || 'Gesund';
	}
</script>

<svelte:head>
	<title>Pflanze hinzufügen - Planta</title>
</svelte:head>

<div class="max-w-2xl mx-auto space-y-6">
	<h1 class="text-2xl font-bold">Pflanze hinzufügen</h1>

	{#if error}
		<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	{#if step === 'upload'}
		<div
			class="upload-zone"
			class:dragover
			role="button"
			tabindex="0"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={() => document.getElementById('file-input')?.click()}
			onkeydown={(e) => e.key === 'Enter' && document.getElementById('file-input')?.click()}
		>
			<div class="text-6xl mb-4">📷</div>
			<p class="text-lg font-medium">Foto hochladen</p>
			<p class="text-sm text-muted-foreground mt-1">
				Ziehe ein Bild hierher oder klicke zum Auswählen
			</p>
			<input
				id="file-input"
				type="file"
				accept="image/*"
				class="hidden"
				onchange={handleFileSelect}
			/>
		</div>

		<p class="text-center text-sm text-muted-foreground">
			Die KI analysiert dein Foto und erstellt automatisch einen Pflanzensteckbrief.
		</p>
	{:else if step === 'analyzing'}
		<div class="text-center py-12">
			<div
				class="h-16 w-16 mx-auto mb-4 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-lg font-medium">Pflanze wird analysiert...</p>
			<p class="text-sm text-muted-foreground mt-1">
				Die KI identifiziert deine Pflanze und erstellt Pflegeempfehlungen.
			</p>
		</div>
	{:else if step === 'result' && analysis}
		<div class="card">
			{#if photo?.publicUrl}
				<img
					src={photo.publicUrl}
					alt="Pflanzenfoto"
					class="w-full h-64 object-cover rounded-lg mb-4"
				/>
			{/if}

			<div class="space-y-4">
				<!-- Identification -->
				<div>
					<h3 class="font-semibold text-lg">
						{analysis.scientificName || 'Unbekannte Pflanze'}
					</h3>
					{#if analysis.commonNames && analysis.commonNames.length > 0}
						<p class="text-muted-foreground">{analysis.commonNames.join(', ')}</p>
					{/if}
					{#if analysis.confidence}
						<p class="text-sm text-muted-foreground mt-1">
							Sicherheit: {analysis.confidence}%
						</p>
					{/if}
				</div>

				<!-- Health Status -->
				<div>
					<span class="health-badge {getHealthBadgeClass(analysis.healthAssessment)}">
						{getHealthText(analysis.healthAssessment)}
					</span>
					{#if analysis.healthDetails}
						<p class="text-sm text-muted-foreground mt-2">{analysis.healthDetails}</p>
					{/if}
				</div>

				<!-- Care Recommendations -->
				<div class="grid grid-cols-2 gap-4">
					{#if analysis.lightAdvice}
						<div class="p-3 bg-muted rounded-lg">
							<p class="text-sm font-medium">☀️ Licht</p>
							<p class="text-sm text-muted-foreground">{analysis.lightAdvice}</p>
						</div>
					{/if}
					{#if analysis.wateringAdvice}
						<div class="p-3 bg-muted rounded-lg">
							<p class="text-sm font-medium">💧 Gießen</p>
							<p class="text-sm text-muted-foreground">{analysis.wateringAdvice}</p>
						</div>
					{/if}
				</div>

				<!-- Care Tips -->
				{#if analysis.generalTips && analysis.generalTips.length > 0}
					<div>
						<p class="text-sm font-medium mb-2">Pflegetipps</p>
						<ul class="list-disc list-inside text-sm text-muted-foreground space-y-1">
							{#each analysis.generalTips as tip}
								<li>{tip}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<!-- Save Form -->
				<div class="border-t pt-4 mt-4">
					<label for="plant-name" class="block text-sm font-medium mb-2">
						Name deiner Pflanze
					</label>
					<input
						id="plant-name"
						type="text"
						bind:value={plantName}
						class="input w-full"
						placeholder="z.B. Meine Monstera"
					/>
					<button
						type="button"
						class="btn btn-success w-full mt-4"
						onclick={savePlant}
						disabled={saving}
					>
						{#if saving}
							<span
								class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"
							></span>
						{:else}
							Pflanze speichern
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
