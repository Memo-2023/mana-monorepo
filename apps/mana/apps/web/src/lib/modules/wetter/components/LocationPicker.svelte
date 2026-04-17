<!--
  Location picker — horizontal scrolling saved location chips,
  GPS/search/manage buttons with labels, manage panel for default/remove.
-->
<script lang="ts">
	import type { WeatherLocation, GeocodingResult } from '../types';
	import { geocode } from '../api';

	interface Props {
		locations: WeatherLocation[];
		selectedLat: number | null;
		selectedLon: number | null;
		onSelect: (lat: number, lon: number, name: string) => void;
		onSave: (name: string, lat: number, lon: number) => void;
		onRemove: (id: string) => void;
		onSetDefault: (id: string) => void;
	}

	let { locations, selectedLat, selectedLon, onSelect, onSave, onRemove, onSetDefault }: Props =
		$props();

	let searching = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<GeocodingResult[]>([]);
	let showSearch = $state(false);
	let showManage = $state(false);
	let locating = $state(false);

	async function onSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim().length < 2) return;
		searching = true;
		try {
			searchResults = await geocode(searchQuery.trim());
		} catch {
			searchResults = [];
		} finally {
			searching = false;
		}
	}

	function selectSearchResult(result: GeocodingResult) {
		const name = result.admin1 ? `${result.name}, ${result.admin1}` : result.name;
		onSelect(result.lat, result.lon, name);
		showSearch = false;
		searchQuery = '';
		searchResults = [];
	}

	function saveAndSelect(result: GeocodingResult) {
		const name = result.admin1 ? `${result.name}, ${result.admin1}` : result.name;
		onSave(name, result.lat, result.lon);
		selectSearchResult(result);
	}

	async function useGps() {
		if (!navigator.geolocation) return;
		locating = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				onSelect(pos.coords.latitude, pos.coords.longitude, 'Aktueller Standort');
				locating = false;
			},
			() => {
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function isSelected(loc: WeatherLocation): boolean {
		if (selectedLat == null || selectedLon == null) return false;
		return Math.abs(loc.lat - selectedLat) < 0.01 && Math.abs(loc.lon - selectedLon) < 0.01;
	}

	function alreadySaved(result: GeocodingResult): boolean {
		return locations.some(
			(l) => Math.abs(l.lat - result.lat) < 0.01 && Math.abs(l.lon - result.lon) < 0.01
		);
	}
</script>

<div class="location-picker">
	<!-- Saved location chips — horizontal scroll -->
	{#if locations.length > 0}
		<div class="chips-scroll">
			{#each locations as loc (loc.id)}
				<button
					class="loc-chip"
					class:active={isSelected(loc)}
					onclick={() => onSelect(loc.lat, loc.lon, loc.name)}
				>
					{#if loc.isDefault}<span class="default-dot"></span>{/if}
					{loc.name}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Action buttons with labels -->
	<div class="actions-row">
		<button class="action-btn" onclick={useGps} disabled={locating}>
			<span class="action-icon">{locating ? '...' : '📍'}</span>
			<span class="action-label">Standort</span>
		</button>
		<button
			class="action-btn"
			class:active={showSearch}
			onclick={() => {
				showSearch = !showSearch;
				showManage = false;
			}}
		>
			<span class="action-icon">+</span>
			<span class="action-label">Hinzufügen</span>
		</button>
		{#if locations.length > 0}
			<button
				class="action-btn"
				class:active={showManage}
				onclick={() => {
					showManage = !showManage;
					showSearch = false;
				}}
			>
				<span class="action-icon">⚙</span>
				<span class="action-label">Verwalten</span>
			</button>
		{/if}
	</div>

	<!-- Search panel -->
	{#if showSearch}
		<div class="panel">
			<form class="search-form" onsubmit={onSearch}>
				<input
					class="search-input"
					type="text"
					placeholder="Stadt suchen..."
					bind:value={searchQuery}
				/>
				<button class="search-btn" type="submit" disabled={searching}>
					{searching ? '...' : 'Suchen'}
				</button>
			</form>

			{#if searchResults.length > 0}
				<div class="search-results">
					{#each searchResults as result}
						{@const saved = alreadySaved(result)}
						<div
							class="result-item"
							role="button"
							tabindex="0"
							onclick={() => {
								if (!saved) saveAndSelect(result);
								else selectSearchResult(result);
							}}
							onkeydown={(e: KeyboardEvent) => {
								if (e.key === 'Enter') {
									if (!saved) saveAndSelect(result);
									else selectSearchResult(result);
								}
							}}
						>
							<span class="result-name">{result.name}</span>
							<span class="result-detail">
								{result.admin1 ? `${result.admin1}, ` : ''}{result.country}
							</span>
							{#if saved}
								<span class="already-saved">Gespeichert</span>
							{:else}
								<span class="save-label">+ Speichern</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Manage panel -->
	{#if showManage}
		<div class="panel manage-panel">
			<span class="panel-title">Gespeicherte Orte</span>
			{#each locations as loc (loc.id)}
				<div class="manage-row">
					<span class="manage-name">
						{#if loc.isDefault}<span class="default-star">★</span>{/if}
						{loc.name}
					</span>
					<span class="manage-coords">{loc.lat.toFixed(2)}, {loc.lon.toFixed(2)}</span>
					<div class="manage-actions">
						{#if !loc.isDefault}
							<button
								class="manage-action"
								title="Als Standard setzen"
								onclick={() => onSetDefault(loc.id)}
							>
								★
							</button>
						{/if}
						<button class="manage-action delete" title="Entfernen" onclick={() => onRemove(loc.id)}>
							×
						</button>
					</div>
				</div>
			{/each}
			<p class="manage-hint">★ = Standard-Ort beim Öffnen</p>
		</div>
	{/if}
</div>

<style>
	.location-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	/* Horizontal scrolling chips */
	.chips-scroll {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		padding: 2px 0;
	}
	.chips-scroll::-webkit-scrollbar {
		height: 0;
	}
	.loc-chip {
		scroll-snap-align: start;
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 5px 12px;
		border-radius: 16px;
		font-size: 0.78rem;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		color: var(--text-secondary, #9ca3af);
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.loc-chip.active {
		background: rgba(56, 189, 248, 0.15);
		color: #38bdf8;
		border-color: rgba(56, 189, 248, 0.3);
	}
	.default-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #38bdf8;
		flex-shrink: 0;
	}

	/* Action buttons with text labels */
	.actions-row {
		display: flex;
		gap: 6px;
	}
	.action-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 5px 10px;
		border-radius: 8px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		cursor: pointer;
		color: var(--text-secondary, #9ca3af);
		transition: all 0.15s ease;
	}
	.action-btn:hover,
	.action-btn.active {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.1));
		color: var(--text-primary, #f3f4f6);
	}
	.action-icon {
		font-size: 0.85rem;
		line-height: 1;
	}
	.action-label {
		font-size: 0.72rem;
	}

	/* Panels */
	.panel {
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 12px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.panel-title {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary, #9ca3af);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* Search */
	.search-form {
		display: flex;
		gap: 8px;
	}
	.search-input {
		flex: 1;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.04));
		color: var(--text-primary, #f3f4f6);
		font-size: 0.85rem;
		outline: none;
	}
	.search-input:focus {
		border-color: #38bdf8;
	}
	.search-btn {
		padding: 8px 16px;
		border-radius: 8px;
		border: none;
		background: #38bdf8;
		color: #0c1221;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}
	.search-btn:disabled {
		opacity: 0.5;
	}
	.search-results {
		display: flex;
		flex-direction: column;
	}
	.result-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 6px;
		border: none;
		background: none;
		color: var(--text-primary, #f3f4f6);
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-radius: 6px;
	}
	.result-item:hover {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.06));
	}
	.result-name {
		font-size: 0.85rem;
		font-weight: 500;
	}
	.result-detail {
		font-size: 0.75rem;
		color: var(--text-secondary, #9ca3af);
		flex: 1;
	}
	.save-label {
		font-size: 0.7rem;
		color: #38bdf8;
		flex-shrink: 0;
	}
	.already-saved {
		font-size: 0.7rem;
		color: var(--text-tertiary, #6b7280);
		flex-shrink: 0;
	}

	/* Manage panel */
	.manage-panel {
		gap: 4px;
	}
	.manage-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 6px;
		border-radius: 6px;
	}
	.manage-row:hover {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.04));
	}
	.manage-name {
		font-size: 0.85rem;
		color: var(--text-primary, #f3f4f6);
		flex: 1;
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.default-star {
		color: #f59e0b;
		font-size: 0.8rem;
	}
	.manage-coords {
		font-size: 0.7rem;
		color: var(--text-tertiary, #6b7280);
	}
	.manage-actions {
		display: flex;
		gap: 4px;
	}
	.manage-action {
		width: 26px;
		height: 26px;
		border-radius: 6px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: none;
		color: var(--text-secondary, #9ca3af);
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.manage-action:hover {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.08));
		color: #f59e0b;
	}
	.manage-action.delete:hover {
		color: #ef4444;
	}
	.manage-hint {
		font-size: 0.65rem;
		color: var(--text-tertiary, #6b7280);
		margin: 4px 0 0;
	}
</style>
