<script lang="ts">
	import type { ThemeColors, EffectiveMode } from '@manacore/shared-theme';
	import {
		Bell,
		Heart,
		MagnifyingGlass,
		House,
		User,
		Gear,
		Check,
		X,
		Sun,
		Moon,
	} from '@manacore/shared-icons';

	interface Props {
		/** Theme colors to preview */
		colors: ThemeColors;
		/** Preview mode (light/dark) */
		mode?: EffectiveMode;
		/** Preview title */
		title?: string;
		/** Callback when mode changes */
		onModeChange?: (mode: EffectiveMode) => void;
	}

	let { colors, mode = 'light', title = 'Live-Vorschau', onModeChange }: Props = $props();

	// Map from camelCase to CSS variable names
	const colorToCssVar: Record<string, string> = {
		primary: 'primary',
		primaryForeground: 'primary-foreground',
		secondary: 'secondary',
		secondaryForeground: 'secondary-foreground',
		background: 'background',
		foreground: 'foreground',
		surface: 'surface',
		surfaceHover: 'surface-hover',
		surfaceElevated: 'surface-elevated',
		muted: 'muted',
		mutedForeground: 'muted-foreground',
		border: 'border',
		input: 'input',
		ring: 'ring',
		success: 'success',
		successForeground: 'success-foreground',
		warning: 'warning',
		warningForeground: 'warning-foreground',
		error: 'error',
		errorForeground: 'error-foreground',
		info: 'info',
		infoForeground: 'info-foreground',
	};

	// Convert colors to CSS variables for inline style
	function colorsToStyle(colors: ThemeColors): string {
		return Object.entries(colors)
			.map(([key, value]) => {
				const cssVar = colorToCssVar[key] || key.replace(/([A-Z])/g, '-$1').toLowerCase();
				return `--${cssVar}: ${value}`;
			})
			.join('; ');
	}

	let styleVars = $derived(colorsToStyle(colors));
</script>

<div class="preview-container" class:dark={mode === 'dark'}>
	<div class="preview-header">
		<span class="preview-title">{title}</span>
		{#if onModeChange}
			<div class="mode-toggle">
				<button
					type="button"
					class="mode-btn"
					class:active={mode === 'light'}
					onclick={() => onModeChange?.('light')}
					aria-label="Hell"
				>
					<Sun size={14} weight={mode === 'light' ? 'fill' : 'regular'} />
				</button>
				<button
					type="button"
					class="mode-btn"
					class:active={mode === 'dark'}
					onclick={() => onModeChange?.('dark')}
					aria-label="Dunkel"
				>
					<Moon size={14} weight={mode === 'dark' ? 'fill' : 'regular'} />
				</button>
			</div>
		{:else}
			<span class="preview-mode">{mode === 'light' ? 'Hell' : 'Dunkel'}</span>
		{/if}
	</div>

	<div class="preview-frame" style={styleVars}>
		<!-- App Header -->
		<div class="app-header">
			<div class="app-logo">
				<div class="logo-icon"></div>
				<span class="app-name">Mana App</span>
			</div>
			<div class="header-actions">
				<button class="icon-button">
					<MagnifyingGlass size={16} />
				</button>
				<button class="icon-button">
					<Bell size={16} />
				</button>
			</div>
		</div>

		<!-- Main Content -->
		<div class="app-content">
			<!-- Card -->
			<div class="preview-card">
				<div class="card-header">
					<div class="avatar"></div>
					<div class="card-info">
						<div class="card-title">Max Mustermann</div>
						<div class="card-subtitle">Beispiel-Kontakt</div>
					</div>
					<button class="icon-button favorite">
						<Heart size={16} weight="fill" />
					</button>
				</div>
				<div class="card-content">
					<p class="card-text">Dies ist eine Vorschau, wie dein Theme in der App aussehen wird.</p>
				</div>
				<div class="card-actions">
					<button class="btn btn-primary">
						<Check size={14} />
						Bestätigen
					</button>
					<button class="btn btn-secondary">
						<X size={14} />
						Abbrechen
					</button>
				</div>
			</div>

			<!-- Status Badges -->
			<div class="status-row">
				<span class="badge success">Erfolgreich</span>
				<span class="badge warning">Ausstehend</span>
				<span class="badge error">Fehler</span>
			</div>

			<!-- Input Preview -->
			<div class="input-preview">
				<input type="text" class="preview-input" placeholder="Suchbegriff eingeben..." />
			</div>
		</div>

		<!-- Bottom Navigation -->
		<div class="app-nav">
			<button class="nav-item active">
				<House size={18} weight="fill" />
				<span>Start</span>
			</button>
			<button class="nav-item">
				<User size={18} />
				<span>Profil</span>
			</button>
			<button class="nav-item">
				<Gear size={18} />
				<span>Einstellungen</span>
			</button>
		</div>
	</div>
</div>

<style>
	.preview-container {
		border-radius: 0.75rem;
		overflow: hidden;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: hsl(var(--muted));
		border-bottom: 1px solid hsl(var(--border));
	}

	.preview-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.preview-mode {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		padding: 0.25rem 0.5rem;
		background: hsl(var(--surface));
		border-radius: 0.25rem;
	}

	.mode-toggle {
		display: flex;
		background: hsl(var(--surface));
		border-radius: 0.375rem;
		padding: 0.125rem;
		gap: 0.125rem;
	}

	.mode-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.5rem;
		background: transparent;
		border: none;
		border-radius: 0.25rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.mode-btn:hover {
		color: hsl(var(--foreground));
	}

	.mode-btn.active {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	/* Preview Frame - uses inline CSS variables */
	.preview-frame {
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		font-size: 0.8125rem;
		min-height: 420px;
		display: flex;
		flex-direction: column;
	}

	/* App Header */
	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: hsl(var(--surface));
		border-bottom: 1px solid hsl(var(--border));
	}

	.app-logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo-icon {
		width: 1.25rem;
		height: 1.25rem;
		background: hsl(var(--primary));
		border-radius: 0.25rem;
	}

	.app-name {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-button {
		width: 1.75rem;
		height: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.icon-button:hover {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.icon-button.favorite {
		color: hsl(var(--primary));
	}

	/* App Content */
	.app-content {
		flex: 1;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	/* Preview Card */
	.preview-card {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.avatar {
		width: 1.75rem;
		height: 1.75rem;
		background: hsl(var(--muted));
		border-radius: 50%;
		flex-shrink: 0;
	}

	.card-info {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-weight: 600;
		color: hsl(var(--foreground));
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-subtitle {
		font-size: 0.625rem;
		color: hsl(var(--muted-foreground));
	}

	.card-content {
		padding: 0.625rem;
	}

	.card-text {
		color: hsl(var(--muted-foreground));
		line-height: 1.4;
	}

	.card-actions {
		display: flex;
		gap: 0.5rem;
		padding: 0.625rem;
		border-top: 1px solid hsl(var(--border));
	}

	/* Buttons */
	.btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.625rem;
		font-size: 0.625rem;
		font-weight: 500;
		border-radius: 0.375rem;
		border: none;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover {
		background: hsl(var(--primary) / 0.9);
	}

	.btn-secondary {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.btn-secondary:hover {
		background: hsl(var(--muted) / 0.8);
	}

	/* Status Row */
	.status-row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.25rem 0.5rem;
		font-size: 0.625rem;
		font-weight: 500;
		border-radius: 0.25rem;
	}

	.badge.success {
		background: hsl(var(--success) / 0.15);
		color: hsl(var(--success));
	}

	.badge.warning {
		background: hsl(var(--warning) / 0.15);
		color: hsl(var(--warning));
	}

	.badge.error {
		background: hsl(var(--error) / 0.15);
		color: hsl(var(--error));
	}

	/* Input Preview */
	.input-preview {
		margin-top: auto;
	}

	.preview-input {
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		background: hsl(var(--input));
		border: 1px solid hsl(var(--border));
		border-radius: 0.375rem;
		color: hsl(var(--foreground));
	}

	.preview-input::placeholder {
		color: hsl(var(--muted-foreground));
	}

	.preview-input:focus {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
	}

	/* Bottom Navigation */
	.app-nav {
		display: flex;
		background: hsl(var(--surface));
		border-top: 1px solid hsl(var(--border));
	}

	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.5rem;
		font-size: 0.5rem;
		background: transparent;
		border: none;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}

	.nav-item:hover {
		color: hsl(var(--foreground));
	}

	.nav-item.active {
		color: hsl(var(--primary));
	}
</style>
