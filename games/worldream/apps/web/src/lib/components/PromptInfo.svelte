<script lang="ts">
	import type { ContentNode } from '$lib/types/content';

	let {
		node,
		class: className = '',
	}: {
		node: ContentNode;
		class?: string;
	} = $props();

	let showFullPrompt = $state(false);
	let showFullContext = $state(false);

	function formatDate(dateString: string | undefined) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	async function reusePrompt() {
		// Kopiere den Prompt in die Zwischenablage
		if (node.generation_prompt) {
			await navigator.clipboard.writeText(node.generation_prompt);
			alert('Prompt wurde in die Zwischenablage kopiert!');
		}
	}

	async function copyFullContext() {
		if (node.generation_context) {
			const contextText = `USER PROMPT:\n${node.generation_context.userPrompt}\n\nSYSTEM PROMPT:\n${node.generation_context.systemPrompt}`;
			await navigator.clipboard.writeText(contextText);
			alert('Vollständiger Kontext wurde in die Zwischenablage kopiert!');
		}
	}
</script>

{#if node.generation_prompt}
	<div class={className}>
		<div class="space-y-6">
			<!-- Main Generation Info -->
			<div>
				<h3 class="mb-4 flex items-center text-lg font-medium text-theme-text-primary">
					<svg
						class="mr-2 h-5 w-5 text-theme-primary-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
					KI-Generiert
				</h3>

				<div class="rounded-lg bg-theme-elevated p-4">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<p class="text-sm font-medium text-theme-text-primary mb-2">Verwendeter Prompt:</p>
							<p class="text-sm text-theme-text-secondary {showFullPrompt ? '' : 'line-clamp-3'}">
								{node.generation_prompt}
							</p>

							{#if node.generation_prompt.length > 150}
								<button
									type="button"
									onclick={() => (showFullPrompt = !showFullPrompt)}
									class="mt-2 text-xs font-medium text-theme-primary-600 hover:text-theme-primary-500"
								>
									{showFullPrompt ? 'Weniger anzeigen' : 'Mehr anzeigen'}
								</button>
							{/if}

							<div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-theme-text-secondary">
								{#if node.generation_model}
									<span class="flex items-center">
										<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
											/>
										</svg>
										{node.generation_model}
									</span>
								{/if}
								{#if node.generation_date}
									<span class="flex items-center">
										<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										{formatDate(node.generation_date)}
									</span>
								{/if}
							</div>
						</div>

						<div class="ml-4 flex flex-col gap-2">
							<button
								type="button"
								onclick={reusePrompt}
								class="inline-flex items-center rounded-md border border-theme-border-default bg-theme-surface px-3 py-1.5 text-xs font-medium text-theme-text-primary hover:bg-theme-interactive-hover"
							>
								<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
								User-Prompt
							</button>
							{#if node.generation_context}
								<button
									type="button"
									onclick={() => (showFullContext = !showFullContext)}
									class="inline-flex items-center rounded-md border border-theme-primary-300 bg-theme-primary-100/50 px-3 py-1.5 text-xs font-medium text-theme-primary-700 hover:bg-theme-primary-200/50 dark:border-theme-primary-600 dark:bg-theme-primary-900/30 dark:text-theme-primary-400 dark:hover:bg-theme-primary-900/50"
								>
									<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									{showFullContext ? 'Debug ausblenden' : 'Debug-Infos'}
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- Debug Context Display -->
			{#if showFullContext && node.generation_context}
				<div class="border-t border-theme-border-subtle pt-6">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-sm font-medium text-theme-text-primary">
							Debug: Vollständiger LLM-Input
						</h4>
						<button
							type="button"
							onclick={copyFullContext}
							class="inline-flex items-center rounded border border-theme-border-default bg-theme-surface px-2 py-1 text-xs text-theme-text-secondary hover:bg-theme-interactive-hover"
						>
							Volltext kopieren
						</button>
					</div>

					<div class="space-y-4">
						<!-- User Prompt -->
						<div>
							<h5 class="text-xs font-medium text-theme-text-primary mb-1">🟢 User-Prompt</h5>
							<div
								class="rounded bg-green-500/10 dark:bg-green-400/10 p-3 text-xs text-theme-text-secondary font-mono whitespace-pre-wrap"
							>
								{node.generation_context.userPrompt}
							</div>
						</div>

						<!-- World Context -->
						{#if node.generation_context.worldDetails}
							<div>
								<h5 class="text-xs font-medium text-theme-text-primary mb-1">🌍 Welt-Kontext</h5>
								<div class="rounded bg-theme-primary-100/50 dark:bg-theme-primary-900/30 p-3">
									<div
										class="text-xs font-medium text-theme-primary-800 dark:text-theme-primary-400"
									>
										{node.generation_context.worldDetails.title}
									</div>
									{#if node.generation_context.worldDetails.summary}
										<div class="text-xs text-theme-primary-600 dark:text-theme-primary-500 mt-1">
											📝 {node.generation_context.worldDetails.summary}
										</div>
									{/if}
									{#if node.generation_context.worldDetails.appearance}
										<div class="text-xs text-theme-primary-600 dark:text-theme-primary-500 mt-1">
											🎨 {node.generation_context.worldDetails.appearance}
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Selected Characters -->
						{#if node.generation_context.selectedCharacters && node.generation_context.selectedCharacters.length > 0}
							<div>
								<h5 class="text-xs font-medium text-theme-text-primary mb-1">
									👥 Ausgewählte Charaktere
								</h5>
								<div class="rounded bg-blue-500/10 dark:bg-blue-400/10 p-3">
									{#each node.generation_context.selectedCharacters as char}
										<div class="mb-2 last:mb-0">
											<div class="text-xs font-medium text-blue-700 dark:text-blue-400">
												@{char.slug} ({char.name})
											</div>
											{#if char.summary}<div class="text-xs text-blue-600 dark:text-blue-500">
													📄 {char.summary}
												</div>{/if}
											{#if char.appearance}<div class="text-xs text-blue-600 dark:text-blue-500">
													👀 {char.appearance}
												</div>{/if}
											{#if char.motivations}<div class="text-xs text-blue-600 dark:text-blue-500">
													🎯 {char.motivations}
												</div>{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Selected Place -->
						{#if node.generation_context.selectedPlace}
							<div>
								<h5 class="text-xs font-medium text-theme-text-primary mb-1">
									📍 Ausgewählter Ort
								</h5>
								<div class="rounded bg-amber-500/10 dark:bg-amber-400/10 p-3">
									<div class="text-xs font-medium text-amber-700 dark:text-amber-400">
										@{node.generation_context.selectedPlace.slug} ({node.generation_context
											.selectedPlace.name})
									</div>
									{#if node.generation_context.selectedPlace.summary}<div
											class="text-xs text-amber-600 dark:text-amber-500"
										>
											📄 {node.generation_context.selectedPlace.summary}
										</div>{/if}
									{#if node.generation_context.selectedPlace.appearance}<div
											class="text-xs text-amber-600 dark:text-amber-500"
										>
											🎨 {node.generation_context.selectedPlace.appearance}
										</div>{/if}
									{#if node.generation_context.selectedPlace.capabilities}<div
											class="text-xs text-amber-600 dark:text-amber-500"
										>
											✨ {node.generation_context.selectedPlace.capabilities}
										</div>{/if}
									{#if node.generation_context.selectedPlace.constraints}<div
											class="text-xs text-amber-600 dark:text-amber-500"
										>
											⚠️ {node.generation_context.selectedPlace.constraints}
										</div>{/if}
								</div>
							</div>
						{/if}

						<!-- System Prompt -->
						<div>
							<h5 class="text-xs font-medium text-theme-text-primary mb-1">🔧 System-Prompt</h5>
							<div
								class="rounded bg-theme-elevated p-3 text-xs text-theme-text-secondary font-mono whitespace-pre-wrap max-h-64 overflow-y-auto"
							>
								{node.generation_context.systemPrompt}
							</div>
						</div>

						<!-- Metadata -->
						<div class="flex items-center space-x-4 text-xs text-theme-text-secondary">
							<span>🤖 {node.generation_context.model}</span>
							<span>⏰ {formatDate(node.generation_context.timestamp)}</span>
							{#if node.generation_context.worldContext}
								<span>🌍 {node.generation_context.worldContext}</span>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
