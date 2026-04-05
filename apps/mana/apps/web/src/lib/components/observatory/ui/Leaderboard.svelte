<script lang="ts">
	import type { AppData, CategoryScores } from '../data/types';

	let { apps, onselect }: { apps: AppData[]; onselect: (app: AppData) => void } = $props();

	type SortKey = 'score' | 'name' | 'trend' | keyof CategoryScores;
	let sortKey = $state<SortKey>('score');
	let sortAsc = $state(false);

	const categoryKeys: (keyof CategoryScores)[] = [
		'backend',
		'frontend',
		'database',
		'testing',
		'deployment',
		'documentation',
		'security',
		'ux',
	];

	const shortLabels: Record<string, string> = {
		backend: 'BE',
		frontend: 'FE',
		database: 'DB',
		testing: 'Test',
		deployment: 'Deploy',
		documentation: 'Docs',
		security: 'Sec',
		ux: 'UX',
	};

	const statusColors: Record<string, string> = {
		mature: '#34d399',
		production: '#60a5fa',
		beta: '#fbbf24',
		alpha: '#f97316',
		prototype: '#94a3b8',
	};

	function scoreColor(score: number): string {
		if (score >= 85) return '#34d399';
		if (score >= 70) return '#60a5fa';
		if (score >= 50) return '#fbbf24';
		if (score >= 30) return '#f97316';
		return '#ef4444';
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = false;
		}
	}

	let sorted = $derived(() => {
		const arr = [...apps];
		arr.sort((a, b) => {
			let va: number | string, vb: number | string;
			if (sortKey === 'score') {
				va = a.score;
				vb = b.score;
			} else if (sortKey === 'name') {
				va = a.displayName.toLowerCase();
				vb = b.displayName.toLowerCase();
			} else if (sortKey === 'trend') {
				va = a.trend;
				vb = b.trend;
			} else {
				va = a.categories[sortKey];
				vb = b.categories[sortKey];
			}
			if (va < vb) return sortAsc ? -1 : 1;
			if (va > vb) return sortAsc ? 1 : -1;
			return 0;
		});
		return arr;
	});

	function sortIndicator(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortAsc ? ' ↑' : ' ↓';
	}
</script>

<div class="leaderboard">
	<div class="table-scroll">
		<table>
			<thead>
				<tr>
					<th class="rank-col">#</th>
					<th class="name-col sortable" onclick={() => toggleSort('name')}>
						App{sortIndicator('name')}
					</th>
					<th class="score-col sortable" onclick={() => toggleSort('score')}>
						Score{sortIndicator('score')}
					</th>
					<th class="trend-col sortable" onclick={() => toggleSort('trend')}>
						Trend{sortIndicator('trend')}
					</th>
					{#each categoryKeys as cat}
						<th class="cat-col sortable" onclick={() => toggleSort(cat)}>
							{shortLabels[cat]}{sortIndicator(cat)}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each sorted() as app, i (app.id)}
					<tr class="app-row" onclick={() => onselect(app)}>
						<td class="rank">{i + 1}</td>
						<td class="name-cell">
							<span class="status-dot" style="background: {statusColors[app.status]}"></span>
							{app.displayName}
						</td>
						<td class="score-cell" style="color: {scoreColor(app.score)}">
							{app.score}
						</td>
						<td class="trend-cell">
							{#if app.trend > 0}
								<span class="trend-up">+{app.trend}</span>
							{:else if app.trend < 0}
								<span class="trend-down">{app.trend}</span>
							{:else}
								<span class="trend-neutral">-</span>
							{/if}
						</td>
						{#each categoryKeys as cat}
							<td class="cat-cell">
								<div class="cat-bar-wrap">
									<div
										class="cat-bar-fill"
										style="width: {app.categories[cat]}%; background: {scoreColor(
											app.categories[cat]
										)}"
									></div>
								</div>
								<span class="cat-value">{app.categories[cat]}</span>
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.leaderboard {
		width: 100%;
	}

	.table-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 800px;
	}

	thead tr {
		border-bottom: 1px solid rgba(148, 163, 184, 0.1);
	}

	th {
		font-size: 10px;
		font-weight: 600;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 8px 6px;
		text-align: left;
		white-space: nowrap;
		user-select: none;
	}

	th.sortable {
		cursor: pointer;
	}

	th.sortable:hover {
		color: #94a3b8;
	}

	.rank-col {
		width: 32px;
		text-align: center;
	}
	.name-col {
		width: 120px;
	}
	.score-col {
		width: 56px;
		text-align: right;
	}
	.trend-col {
		width: 48px;
		text-align: right;
	}
	.cat-col {
		width: 70px;
		text-align: right;
	}

	.app-row {
		border-bottom: 1px solid rgba(148, 163, 184, 0.05);
		cursor: pointer;
		transition: background 0.15s;
	}

	.app-row:hover {
		background: rgba(59, 130, 246, 0.06);
	}

	td {
		padding: 8px 6px;
		font-size: 12px;
		color: #cbd5e1;
	}

	.rank {
		text-align: center;
		color: #64748b;
		font-weight: 600;
		font-size: 11px;
	}

	.name-cell {
		display: flex;
		align-items: center;
		gap: 6px;
		font-weight: 500;
		color: #f1f5f9;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.score-cell {
		text-align: right;
		font-weight: 700;
		font-size: 14px;
		font-variant-numeric: tabular-nums;
	}

	.trend-cell {
		text-align: right;
		font-size: 11px;
		font-weight: 600;
	}

	.trend-up {
		color: #34d399;
	}
	.trend-down {
		color: #ef4444;
	}
	.trend-neutral {
		color: #475569;
	}

	.cat-cell {
		text-align: right;
	}

	.cat-bar-wrap {
		display: inline-block;
		width: 32px;
		height: 4px;
		background: rgba(148, 163, 184, 0.1);
		border-radius: 2px;
		overflow: hidden;
		vertical-align: middle;
		margin-right: 4px;
	}

	.cat-bar-fill {
		height: 100%;
		border-radius: 2px;
	}

	.cat-value {
		font-size: 10px;
		font-variant-numeric: tabular-nums;
		color: #94a3b8;
	}
</style>
