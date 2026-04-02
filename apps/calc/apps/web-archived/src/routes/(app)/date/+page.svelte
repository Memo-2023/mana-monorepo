<script lang="ts">
	let date1 = $state(new Date().toISOString().split('T')[0]);
	let date2 = $state('');
	let addDays = $state(0);

	let daysBetween = $derived(() => {
		if (!date1 || !date2) return null;
		const d1 = new Date(date1);
		const d2 = new Date(date2);
		const diff = Math.abs(d2.getTime() - d1.getTime());
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
		const weeks = Math.floor(days / 7);
		const months = Math.round(days / 30.44);
		return { days, weeks, months };
	});

	let addedDate = $derived(() => {
		if (!date1 || !addDays) return null;
		const d = new Date(date1);
		d.setDate(d.getDate() + addDays);
		return d;
	});

	function formatDate(d: Date): string {
		return d.toLocaleDateString('de-DE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Calc - Datum</title>
</svelte:head>

<div class="date-page">
	<!-- Days between dates -->
	<div class="p-6 rounded-xl bg-card border border-border space-y-4 mb-6">
		<h2 class="text-lg font-bold text-foreground">Tage zwischen Daten</h2>
		<div class="grid grid-cols-2 gap-4">
			<label class="block">
				<span class="text-xs text-muted-foreground">Von</span>
				<input
					type="date"
					bind:value={date1}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
				/>
			</label>
			<label class="block">
				<span class="text-xs text-muted-foreground">Bis</span>
				<input
					type="date"
					bind:value={date2}
					class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
				/>
			</label>
		</div>
		{#if daysBetween()}
			<div class="pt-4 border-t border-border">
				<div class="text-3xl font-bold text-foreground font-mono text-center">
					{daysBetween()?.days} Tage
				</div>
				<div class="text-sm text-muted-foreground text-center mt-1">
					= {daysBetween()?.weeks} Wochen = ~{daysBetween()?.months} Monate
				</div>
			</div>
		{/if}
	</div>

	<!-- Add/subtract days -->
	<div class="p-6 rounded-xl bg-card border border-border space-y-4">
		<h2 class="text-lg font-bold text-foreground">Tage addieren/subtrahieren</h2>
		<label class="block">
			<span class="text-xs text-muted-foreground">Startdatum</span>
			<input
				type="date"
				bind:value={date1}
				class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground"
			/>
		</label>
		<label class="block">
			<span class="text-xs text-muted-foreground">Tage (+/-)</span>
			<input
				type="number"
				bind:value={addDays}
				class="mt-1 w-full h-10 px-3 rounded-lg bg-background border border-border text-foreground font-mono"
			/>
		</label>
		<div class="flex gap-2">
			{#each [7, 14, 30, 90, 365] as days}
				<button
					class="flex-1 py-1.5 rounded-lg text-xs transition-all border {addDays === days
						? 'bg-orange-500 text-white border-orange-500'
						: 'bg-card border-border text-muted-foreground hover:bg-muted'}"
					onclick={() => (addDays = days)}>+{days}</button
				>
			{/each}
		</div>
		{#if addedDate()}
			<div class="pt-4 border-t border-border text-center">
				<div class="text-lg font-bold text-foreground">{formatDate(addedDate()!)}</div>
				<div class="text-xs text-muted-foreground mt-1">
					{addedDate()!.toISOString().split('T')[0]}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.date-page {
		max-width: 500px;
		margin: 0 auto;
	}
</style>
