<script lang="ts">
	interface Props {
		prompt: string;
		temperature: number;
		maxTokens: number;
		isRunning: boolean;
		disabled?: boolean;
		onPromptChange: (value: string) => void;
		onTemperatureChange: (value: number) => void;
		onMaxTokensChange: (value: number) => void;
		onCompare: () => void;
	}

	let {
		prompt,
		temperature,
		maxTokens,
		isRunning,
		disabled = false,
		onPromptChange,
		onTemperatureChange,
		onMaxTokensChange,
		onCompare,
	}: Props = $props();

	const maxTokensOptions = [256, 512, 1024, 2048, 4096];

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (!disabled && !isRunning && prompt.trim()) {
				onCompare();
			}
		}
	}
</script>

<div class="rounded-xl border border-border bg-card p-4 shadow-sm">
	<!-- Prompt Input -->
	<textarea
		class="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background
			   text-foreground placeholder:text-muted-foreground resize-y
			   focus:outline-none focus:ring-2 focus:ring-primary/50"
		placeholder="Gib deinen Prompt ein... (Strg+Enter zum Starten)"
		value={prompt}
		oninput={(e) => onPromptChange(e.currentTarget.value)}
		onkeydown={handleKeydown}
		disabled={isRunning || disabled}
	></textarea>

	<!-- Controls -->
	<div class="flex flex-wrap items-center gap-4 mt-4">
		<!-- Temperature -->
		<div class="flex items-center gap-2">
			<label for="temperature" class="text-sm text-muted-foreground whitespace-nowrap">
				Temperatur: {temperature.toFixed(1)}
			</label>
			<input
				id="temperature"
				type="range"
				min="0"
				max="2"
				step="0.1"
				value={temperature}
				oninput={(e) => onTemperatureChange(parseFloat(e.currentTarget.value))}
				disabled={isRunning || disabled}
				class="w-24 h-2 bg-muted rounded-full appearance-none cursor-pointer
					   [&::-webkit-slider-thumb]:appearance-none
					   [&::-webkit-slider-thumb]:w-4
					   [&::-webkit-slider-thumb]:h-4
					   [&::-webkit-slider-thumb]:rounded-full
					   [&::-webkit-slider-thumb]:bg-primary
					   [&::-webkit-slider-thumb]:cursor-pointer
					   disabled:opacity-50"
			/>
		</div>

		<!-- Max Tokens -->
		<div class="flex items-center gap-2">
			<label for="maxTokens" class="text-sm text-muted-foreground whitespace-nowrap">
				Max Tokens:
			</label>
			<select
				id="maxTokens"
				value={maxTokens}
				onchange={(e) => onMaxTokensChange(parseInt(e.currentTarget.value))}
				disabled={isRunning || disabled}
				class="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground
					   text-sm focus:outline-none focus:ring-2 focus:ring-primary/50
					   disabled:opacity-50"
			>
				{#each maxTokensOptions as option}
					<option value={option}>{option.toLocaleString('de-DE')}</option>
				{/each}
			</select>
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Compare Button -->
		<button
			onclick={onCompare}
			disabled={isRunning || disabled || !prompt.trim()}
			class="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium
				   hover:bg-primary/90 transition-colors
				   disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if isRunning}
				Läuft...
			{:else}
				Vergleichen
			{/if}
		</button>
	</div>
</div>
