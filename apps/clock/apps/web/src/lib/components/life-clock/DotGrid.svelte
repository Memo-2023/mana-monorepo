<script lang="ts">
	interface Props {
		weeksLived: number;
		lifeExpectancyYears?: number;
	}

	let { weeksLived, lifeExpectancyYears = 80 }: Props = $props();

	// Calculate total weeks in expected lifetime
	let totalWeeks = $derived(Math.ceil(lifeExpectancyYears * 52.1775));
	let weeksPerRow = 52; // One year per row
	let totalRows = $derived(Math.ceil(totalWeeks / weeksPerRow));

	// Generate rows with decade markers
	let rows = $derived(() => {
		const result: {
			year: number;
			weeks: { index: number; lived: boolean }[];
			isDecade: boolean;
		}[] = [];
		for (let year = 0; year < totalRows; year++) {
			const weeks: { index: number; lived: boolean }[] = [];
			for (let week = 0; week < weeksPerRow; week++) {
				const weekIndex = year * weeksPerRow + week;
				if (weekIndex < totalWeeks) {
					weeks.push({
						index: weekIndex,
						lived: weekIndex < weeksLived,
					});
				}
			}
			result.push({
				year: year + 1,
				weeks,
				isDecade: (year + 1) % 10 === 0,
			});
		}
		return result;
	});

	let percentageLived = $derived(Math.min((weeksLived / totalWeeks) * 100, 100).toFixed(1));
	let yearsLived = $derived(Math.floor(weeksLived / 52));
</script>

<div class="dot-grid-container">
	<!-- Header Stats -->
	<div class="dot-grid-header">
		<div class="header-main">
			<span class="header-weeks">{weeksLived.toLocaleString('de-DE')}</span>
			<span class="header-label">Wochen gelebt</span>
		</div>
		<div class="header-secondary">
			<span>{percentageLived}% von {totalWeeks.toLocaleString('de-DE')} Wochen</span>
		</div>
	</div>

	<!-- Grid -->
	<div class="dot-grid-wrapper">
		<div class="dot-grid">
			{#each rows() as row}
				<div class="dot-row" class:decade-row={row.isDecade}>
					<span class="year-label" class:decade-label={row.isDecade}>
						{row.year}
					</span>
					<div class="dots">
						{#each row.weeks as week, i}
							{#if i === 26}
								<div class="half-year-marker"></div>
							{/if}
							<div
								class="dot"
								class:lived={week.lived}
								class:current={week.index === weeksLived}
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Legend -->
	<div class="dot-grid-legend">
		<div class="legend-item">
			<div class="legend-dot lived"></div>
			<span>Gelebt ({yearsLived} Jahre)</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot current"></div>
			<span>Aktuelle Woche</span>
		</div>
		<div class="legend-item">
			<div class="legend-dot"></div>
			<span>Verbleibend</span>
		</div>
	</div>
</div>

<style>
	.dot-grid-container {
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
	}

	/* Header */
	.dot-grid-header {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.header-main {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
	}

	.header-weeks {
		font-size: 2.5rem;
		font-weight: 200;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-foreground));
	}

	.header-label {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
	}

	.header-secondary {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground) / 0.8);
	}

	/* Grid Wrapper */
	.dot-grid-wrapper {
		overflow-x: auto;
		overflow-y: auto;
		max-height: 50vh;
		padding: 1rem;
		background: hsl(var(--color-muted) / 0.03);
		border-radius: var(--radius-lg);
		border: 1px solid hsl(var(--color-border) / 0.5);
	}

	.dot-grid {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: fit-content;
	}

	/* Rows */
	.dot-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1px 0;
	}

	.dot-row.decade-row {
		padding-bottom: 6px;
		margin-bottom: 4px;
		border-bottom: 1px solid hsl(var(--color-border) / 0.3);
	}

	/* Year Labels */
	.year-label {
		font-size: 0.5rem;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--color-muted-foreground) / 0.5);
		width: 1.25rem;
		text-align: right;
		flex-shrink: 0;
	}

	.year-label.decade-label {
		font-size: 0.625rem;
		font-weight: 600;
		color: hsl(var(--color-muted-foreground));
	}

	/* Dots Container */
	.dots {
		display: flex;
		gap: 2px;
		flex-wrap: nowrap;
		align-items: center;
	}

	/* Half Year Marker */
	.half-year-marker {
		width: 1px;
		height: 6px;
		background: hsl(var(--color-border) / 0.3);
		margin: 0 1px;
	}

	/* Individual Dots */
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: hsl(var(--color-muted-foreground) / 0.12);
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.dot.lived {
		background: hsl(var(--color-primary));
	}

	.dot.current {
		background: hsl(var(--color-primary));
		box-shadow:
			0 0 0 2px hsl(var(--color-background)),
			0 0 0 4px hsl(var(--color-primary));
		position: relative;
		z-index: 1;
	}

	.dot:hover {
		transform: scale(1.4);
		z-index: 2;
	}

	/* Legend */
	.dot-grid-legend {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--color-border) / 0.3);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 3px;
		background: hsl(var(--color-muted-foreground) / 0.12);
	}

	.legend-dot.lived {
		background: hsl(var(--color-primary));
	}

	.legend-dot.current {
		background: hsl(var(--color-primary));
		box-shadow:
			0 0 0 2px hsl(var(--color-background)),
			0 0 0 3px hsl(var(--color-primary));
	}

	/* Responsive */
	@media (min-width: 640px) {
		.dot-grid-container {
			max-width: 800px;
		}

		.dot {
			width: 10px;
			height: 10px;
		}

		.dots {
			gap: 3px;
		}

		.dot-grid {
			gap: 3px;
		}

		.half-year-marker {
			height: 8px;
			margin: 0 2px;
		}

		.dot-grid-wrapper {
			max-height: 55vh;
			padding: 1.5rem;
		}

		.header-weeks {
			font-size: 3rem;
		}
	}

	@media (min-width: 1024px) {
		.dot-grid-container {
			max-width: 900px;
		}

		.dot {
			width: 11px;
			height: 11px;
			border-radius: 2px;
		}

		.dots {
			gap: 4px;
		}

		.dot-grid {
			gap: 4px;
		}

		.dot-grid-wrapper {
			max-height: 60vh;
			padding: 2rem;
		}

		.year-label {
			font-size: 0.625rem;
			width: 1.5rem;
		}

		.year-label.decade-label {
			font-size: 0.75rem;
		}
	}
</style>
