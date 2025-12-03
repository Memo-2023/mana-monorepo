<script lang="ts">
	import { goto } from '$app/navigation';
	import { groupsApi } from '$lib/api/contacts';
	import '$lib/i18n';

	let loading = $state(false);
	let error = $state<string | null>(null);

	let name = $state('');
	let description = $state('');
	let color = $state('#6366f1');

	const presetColors = [
		'#ef4444', // red
		'#f97316', // orange
		'#f59e0b', // amber
		'#84cc16', // lime
		'#22c55e', // green
		'#14b8a6', // teal
		'#06b6d4', // cyan
		'#3b82f6', // blue
		'#6366f1', // indigo
		'#8b5cf6', // violet
		'#a855f7', // purple
		'#ec4899', // pink
	];

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Bitte einen Namen eingeben';
			return;
		}

		loading = true;
		error = null;

		try {
			await groupsApi.create({
				name: name.trim(),
				description: description.trim() || undefined,
				color,
			});
			goto('/groups');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Erstellen der Gruppe';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Neue Gruppe - Contacts</title>
</svelte:head>

<div class="page-container">
	<!-- Header -->
	<header class="header">
		<a href="/groups" class="back-button" aria-label="Zurück">
			<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
		</a>
		<h1 class="title">Neue Gruppe</h1>
		<div class="header-spacer"></div>
	</header>

	<!-- Preview -->
	<div class="preview-section">
		<div class="preview-color" style="background-color: {color}">
			<svg class="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
		</div>
		<p class="preview-name">{name || 'Neue Gruppe'}</p>
		{#if description}
			<p class="preview-description">{description}</p>
		{/if}
	</div>

	{#if error}
		<div class="error-banner" role="alert">
			<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>{error}</span>
		</div>
	{/if}

	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="form"
	>
		<!-- Name Section -->
		<section class="form-section">
			<div class="section-header">
				<div class="section-icon">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
				</div>
				<h2 class="section-title">Gruppenname</h2>
			</div>
			<div class="form-field">
				<label for="name" class="label">Name</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					class="input"
					placeholder="z.B. Familie, Arbeit, Freunde"
					required
				/>
			</div>
			<div class="form-field">
				<label for="description" class="label">Beschreibung (optional)</label>
				<textarea
					id="description"
					bind:value={description}
					rows="3"
					class="input textarea"
					placeholder="Kurze Beschreibung der Gruppe..."
				></textarea>
			</div>
		</section>

		<!-- Color Section -->
		<section class="form-section">
			<div class="section-header">
				<div class="section-icon" style="background-color: {color}20; color: {color}">
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
						/>
					</svg>
				</div>
				<h2 class="section-title">Farbe</h2>
			</div>
			<div class="color-picker">
				{#each presetColors as presetColor}
					<button
						type="button"
						class="color-option"
						class:selected={color === presetColor}
						style="background-color: {presetColor}"
						onclick={() => (color = presetColor)}
						aria-label="Farbe {presetColor}"
					>
						{#if color === presetColor}
							<svg class="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="3"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						{/if}
					</button>
				{/each}
			</div>
			<div class="custom-color">
				<label for="customColor" class="label">Oder eigene Farbe wählen:</label>
				<div class="color-input-wrapper">
					<input id="customColor" type="color" bind:value={color} class="color-input" />
					<input
						type="text"
						bind:value={color}
						class="input color-text"
						pattern="^#[0-9A-Fa-f]{6}$"
						placeholder="#6366f1"
					/>
				</div>
			</div>
		</section>

		<!-- Action Buttons -->
		<div class="actions">
			<a href="/groups" class="btn btn-secondary"> Abbrechen </a>
			<button type="submit" disabled={loading} class="btn btn-primary">
				{#if loading}
					<svg class="spinner" viewBox="0 0 24 24" fill="none">
						<circle
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="3"
							stroke-opacity="0.25"
						/>
						<path
							d="M12 2a10 10 0 0 1 10 10"
							stroke="currentColor"
							stroke-width="3"
							stroke-linecap="round"
						/>
					</svg>
					<span>Erstellen...</span>
				{:else}
					<svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						/>
					</svg>
					<span>Gruppe erstellen</span>
				{/if}
			</button>
		</div>
	</form>
</div>

<style>
	.page-container {
		max-width: 640px;
		margin: 0 auto;
		padding: 0 1rem 2rem;
	}

	/* Header */
	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 0;
		position: sticky;
		top: 0;
		background: hsl(var(--color-background));
		z-index: 10;
		margin-bottom: 0.5rem;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: hsl(var(--color-surface-hover));
		transform: translateX(-2px);
	}

	.title {
		flex: 1;
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}

	.header-spacer {
		width: 2.5rem;
	}

	/* Preview Section */
	.preview-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.5rem 0 2rem;
	}

	.preview-color {
		width: 80px;
		height: 80px;
		border-radius: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1rem;
		box-shadow: 0 8px 24px currentColor;
		transition: all 0.3s ease;
	}

	.preview-icon {
		width: 2.5rem;
		height: 2.5rem;
		color: white;
	}

	.preview-name {
		font-size: 1.25rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		text-align: center;
	}

	.preview-description {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		margin-top: 0.25rem;
	}

	/* Error Banner */
	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		background: hsl(var(--color-error) / 0.1);
		border: 1px solid hsl(var(--color-error) / 0.3);
		border-radius: 0.75rem;
		color: hsl(var(--color-error));
		margin-bottom: 1.5rem;
	}

	/* Form */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Form Section */
	.form-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 1rem;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.25rem;
	}

	.section-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
	}

	.section-icon svg {
		width: 1.125rem;
		height: 1.125rem;
	}

	.section-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	/* Form Fields */
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.625rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		transition: all 0.2s ease;
	}

	.input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.input::placeholder {
		color: hsl(var(--color-muted-foreground) / 0.6);
	}

	.textarea {
		resize: none;
		min-height: 80px;
	}

	/* Color Picker */
	.color-picker {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0.75rem;
	}

	.color-option {
		aspect-ratio: 1;
		border-radius: 0.625rem;
		border: 3px solid transparent;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.color-option:hover {
		transform: scale(1.1);
	}

	.color-option.selected {
		border-color: hsl(var(--color-foreground));
		box-shadow: 0 0 0 2px hsl(var(--color-background));
	}

	.check-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: white;
	}

	.custom-color {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: 0.5rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border) / 0.5);
	}

	.color-input-wrapper {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.color-input {
		width: 3rem;
		height: 3rem;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		padding: 0;
		overflow: hidden;
	}

	.color-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}

	.color-input::-webkit-color-swatch {
		border: none;
		border-radius: 0.5rem;
	}

	.color-text {
		flex: 1;
		text-transform: uppercase;
		font-family: monospace;
	}

	/* Action Buttons */
	.actions {
		display: flex;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		text-decoration: none;
	}

	.btn-primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		box-shadow: 0 4px 12px hsl(var(--color-primary) / 0.3);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px hsl(var(--color-primary) / 0.4);
	}

	.btn-primary:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	.btn-secondary {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-secondary:hover {
		background: hsl(var(--color-surface-hover));
	}

	/* Icons */
	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}

	.icon-sm {
		width: 1rem;
		height: 1rem;
	}

	/* Spinner */
	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 480px) {
		.color-picker {
			grid-template-columns: repeat(4, 1fr);
		}

		.actions {
			flex-direction: column-reverse;
		}
	}
</style>
