<!--
  Location picker — dropdown of saved locations + GPS + search.
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
	}

	let { locations, selectedLat, selectedLon, onSelect, onSave }: Props = $props();

	let searching = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<GeocodingResult[]>([]);
	let showSearch = $state(false);
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
</script>

<div class="location-picker">
	<div class="picker-row">
		{#if locations.length > 0}
			<div class="location-chips">
				{#each locations as loc (loc.id)}
					<button
						class="loc-chip"
						class:active={isSelected(loc)}
						onclick={() => onSelect(loc.lat, loc.lon, loc.name)}
					>
						{loc.name}
					</button>
				{/each}
			</div>
		{/if}
		<div class="picker-actions">
			<button class="action-btn" onclick={useGps} disabled={locating} title="Aktueller Standort">
				{locating ? '...' : '📍'}
			</button>
			<button class="action-btn" onclick={() => (showSearch = !showSearch)} title="Ort suchen">
				🔍
			</button>
		</div>
	</div>

	{#if showSearch}
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
					<div
						class="result-item"
						role="button"
						tabindex="0"
						onclick={() => selectSearchResult(result)}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter') selectSearchResult(result);
						}}
					>
						<span class="result-name">{result.name}</span>
						<span class="result-detail">
							{result.admin1 ? `${result.admin1}, ` : ''}{result.country}
						</span>
						<button
							class="save-btn"
							title="Ort speichern"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								const name = result.admin1 ? `${result.name}, ${result.admin1}` : result.name;
								onSave(name, result.lat, result.lon);
								selectSearchResult(result);
							}}
						>
							+
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.location-picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.picker-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.location-chips {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
		flex: 1;
	}
	.loc-chip {
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 0.8rem;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		color: var(--text-secondary, #9ca3af);
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.loc-chip.active {
		background: var(--accent-subtle, rgba(56, 189, 248, 0.15));
		color: #38bdf8;
		border-color: rgba(56, 189, 248, 0.3);
	}
	.picker-actions {
		display: flex;
		gap: 4px;
		flex-shrink: 0;
	}
	.action-btn {
		width: 36px;
		height: 36px;
		border-radius: 18px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		cursor: pointer;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.action-btn:hover {
		background: var(--card-bg-hover, rgba(255, 255, 255, 0.1));
	}
	.search-form {
		display: flex;
		gap: 8px;
	}
	.search-input {
		flex: 1;
		padding: 8px 12px;
		border-radius: 8px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
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
		gap: 2px;
		background: var(--card-bg, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
		border-radius: 10px;
		overflow: hidden;
	}
	.result-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border: none;
		background: none;
		color: var(--text-primary, #f3f4f6);
		cursor: pointer;
		text-align: left;
		width: 100%;
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
	.save-btn {
		width: 24px;
		height: 24px;
		border-radius: 12px;
		border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.15));
		background: none;
		color: var(--text-secondary, #9ca3af);
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.save-btn:hover {
		background: var(--accent-subtle, rgba(56, 189, 248, 0.15));
		color: #38bdf8;
	}
</style>
