<script lang="ts">
	let iframeEl: HTMLIFrameElement | undefined = $state();
	let loaded = $state(false);
	let error = $state(false);

	function onLoad() {
		loaded = true;
	}

	function onError() {
		error = true;
	}

	function regenerateHint() {
		navigator.clipboard?.writeText('pnpm audit:map');
	}
</script>

<div class="space-y-4">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h2 class="text-lg font-semibold">Complexity Map</h2>
			<p class="text-sm text-muted-foreground">
				Interactive treemap of the entire codebase. Area = lines of code, color = git change
				frequency (last 6 months).
			</p>
		</div>
		<button
			type="button"
			onclick={regenerateHint}
			class="text-xs px-3 py-1.5 rounded-md border bg-muted/40 hover:bg-muted transition-colors"
			title="Copy regeneration command to clipboard"
		>
			Regenerate: <code>pnpm audit:map</code>
		</button>
	</div>

	{#if error}
		<div class="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
			<p class="font-medium text-amber-700 dark:text-amber-300">Map not yet generated.</p>
			<p class="mt-1 text-muted-foreground">
				Run <code class="px-1 py-0.5 rounded bg-muted">pnpm audit:map</code> from the repo root. It
				writes to
				<code class="px-1 py-0.5 rounded bg-muted">static/admin/complexity-map.html</code>.
			</p>
		</div>
	{/if}

	<div
		class="rounded-lg border overflow-hidden bg-background"
		style="height: calc(100vh - 280px); min-height: 500px;"
	>
		<iframe
			bind:this={iframeEl}
			src="/admin/complexity-map.html"
			title="Complexity Map"
			class="w-full h-full border-0"
			onload={onLoad}
			onerror={onError}
		></iframe>
	</div>

	<details class="text-sm rounded-md border bg-muted/20 p-3">
		<summary class="cursor-pointer font-medium">Related reports</summary>
		<ul class="mt-2 space-y-1 text-muted-foreground">
			<li><code>docs/module-health.md</code> — per-module LOC × churn score</li>
			<li><code>docs/module-coupling.md</code> — inter-module imports (fan-in / fan-out)</li>
			<li><code>docs/complexity-hotspots.md</code> — top functions by cognitive complexity</li>
		</ul>
		<p class="mt-2 text-xs text-muted-foreground">
			All reports regenerate automatically every Monday 06:00 UTC via the
			<code>module-health</code> GitHub Action.
		</p>
	</details>
</div>
