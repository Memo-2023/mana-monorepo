<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { Building2, ArrowLeft, Users, Globe, Lock, AlertCircle, CheckCircle } from 'lucide-svelte';
	import type { ActionData, PageData } from './$types';
	import { validateWorkspaceSlug } from '$lib/utils/reserved-slugs';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	
	let isSubmitting = $state(false);
	let workspaceName = $state('');
	let workspaceDescription = $state('');
	let workspaceType = $state<'team' | 'personal'>('team');
	let workspaceSlug = $state('');
	
	// Client-side slug validation
	let slugValidation = $derived.by(() => {
		if (!workspaceSlug) return null;
		return validateWorkspaceSlug(workspaceSlug);
	});
	
	let isSlugValid = $derived(workspaceSlug === '' || slugValidation === null);
</script>

<div class="mx-auto max-w-4xl">
	<!-- Header -->
	<div class="mb-8">
		<button
			onclick={() => goto('/settings')}
			class="mb-4 flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-text"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to Settings
		</button>
		
		<h1 class="text-3xl font-bold text-theme-text">Create New Workspace</h1>
		<p class="mt-2 text-theme-text-muted">
			Set up a new workspace for your team or project
		</p>
		{#if data?.workspaceCount !== undefined && data?.workspaceLimit !== undefined}
			<p class="mt-1 text-sm text-theme-text-muted">
				You have created {data.workspaceCount} of {data.workspaceLimit} team workspaces
			</p>
		{/if}
	</div>

	<!-- Creation Form -->
	<div class="rounded-lg bg-white shadow-sm dark:bg-gray-800">
		<form 
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ result, update }) => {
					await update();
					isSubmitting = false;
					if (result.type === 'redirect') {
						// Handle redirect
					}
				};
			}}
			class="p-6 space-y-6"
		>
			<!-- Workspace Type -->
			<div>
				<label class="block text-sm font-medium text-theme-text mb-3">
					Workspace Type
				</label>
				<div class="grid grid-cols-2 gap-4">
					<button
						type="button"
						onclick={() => workspaceType = 'team'}
						class="relative rounded-lg border-2 p-4 transition-all {workspaceType === 'team' 
							? 'border-theme-primary bg-theme-primary/5' 
							: 'border-theme-border hover:border-theme-primary/50'}"
					>
						<div class="flex items-start gap-3">
							<Users class="h-5 w-5 {workspaceType === 'team' ? 'text-theme-primary' : 'text-theme-text-muted'}" />
							<div class="text-left">
								<h3 class="font-medium text-theme-text">Team Workspace</h3>
								<p class="mt-1 text-sm text-theme-text-muted">
									Collaborate with team members
								</p>
							</div>
						</div>
						{#if workspaceType === 'team'}
							<div class="absolute top-2 right-2">
								<div class="h-2 w-2 rounded-full bg-theme-primary"></div>
							</div>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => workspaceType = 'personal'}
						class="relative rounded-lg border-2 p-4 transition-all {workspaceType === 'personal' 
							? 'border-theme-primary bg-theme-primary/5' 
							: 'border-theme-border hover:border-theme-primary/50'}"
						disabled
					>
						<div class="flex items-start gap-3">
							<Lock class="h-5 w-5 text-theme-text-muted" />
							<div class="text-left">
								<h3 class="font-medium text-theme-text-muted">Personal Workspace</h3>
								<p class="mt-1 text-sm text-theme-text-muted">
									You already have a personal workspace
								</p>
							</div>
						</div>
					</button>
				</div>
				<input type="hidden" name="type" value={workspaceType} />
			</div>

			<!-- Workspace Name -->
			<div>
				<label for="name" class="block text-sm font-medium text-theme-text mb-2">
					Workspace Name *
				</label>
				<input
					id="name"
					name="name"
					type="text"
					bind:value={workspaceName}
					required
					placeholder="e.g., Marketing Team, Design Projects"
					class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="description" class="block text-sm font-medium text-theme-text mb-2">
					Description
				</label>
				<textarea
					id="description"
					name="description"
					bind:value={workspaceDescription}
					rows="3"
					placeholder="What is this workspace for?"
					class="w-full rounded-lg border border-theme-border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-primary focus:outline-none focus:ring-2 focus:ring-theme-primary/20"
				></textarea>
			</div>

			<!-- Workspace URL -->
			<div>
				<label for="slug" class="block text-sm font-medium text-theme-text mb-2">
					Workspace URL (optional)
				</label>
				<div class="flex items-center">
					<span class="rounded-l-lg border border-r-0 border-theme-border bg-theme-surface px-3 py-2 text-sm text-theme-text-muted">
						ulo.ad/w/
					</span>
					<input
						id="slug"
						name="slug"
						type="text"
						bind:value={workspaceSlug}
						placeholder="marketing-team"
						pattern="[a-z0-9\-]+"
						class="flex-1 rounded-r-lg border bg-theme-background px-4 py-2 text-theme-text placeholder-theme-text-muted focus:outline-none focus:ring-2 {
							workspaceSlug && !isSlugValid 
								? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
								: workspaceSlug && isSlugValid
									? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
									: 'border-theme-border focus:border-theme-primary focus:ring-theme-primary/20'
						}"
					/>
				</div>
				<!-- Slug validation feedback -->
				{#if workspaceSlug}
					<div class="mt-2 flex items-center gap-2 text-xs">
						{#if isSlugValid}
							<CheckCircle class="h-3 w-3 text-green-500" />
							<span class="text-green-600 dark:text-green-400">Available workspace URL</span>
						{:else}
							<AlertCircle class="h-3 w-3 text-red-500" />
							<span class="text-red-600 dark:text-red-400">{slugValidation}</span>
						{/if}
					</div>
				{:else}
					<p class="mt-1 text-xs text-theme-text-muted">
						Only lowercase letters, numbers, and hyphens. Leave empty for auto-generated.
					</p>
				{/if}
			</div>

			<!-- Security Notice -->
			<div class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
				<div class="flex items-start gap-3">
					<div class="flex-shrink-0">
						<AlertCircle class="h-5 w-5 text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<h4 class="text-sm font-medium text-amber-800 dark:text-amber-300">
							🔒 Workspace URL Protection
						</h4>
						<p class="mt-1 text-xs text-amber-700 dark:text-amber-400">
							Some workspace URLs are reserved to prevent conflicts with existing user profiles, system routes, and well-known brands. This protects against confusion and potential phishing attempts.
						</p>
					</div>
				</div>
			</div>

			<!-- Features Preview -->
			<div class="rounded-lg bg-theme-surface p-4">
				<h3 class="text-sm font-medium text-theme-text mb-3">
					What you'll get:
				</h3>
				<div class="space-y-2">
					<div class="flex items-center gap-2 text-sm text-theme-text-muted">
						<div class="h-1.5 w-1.5 rounded-full bg-green-500"></div>
						Separate link collection for this workspace
					</div>
					<div class="flex items-center gap-2 text-sm text-theme-text-muted">
						<div class="h-1.5 w-1.5 rounded-full bg-green-500"></div>
						Invite team members with specific permissions
					</div>
					<div class="flex items-center gap-2 text-sm text-theme-text-muted">
						<div class="h-1.5 w-1.5 rounded-full bg-green-500"></div>
						Workspace analytics and statistics
					</div>
					<div class="flex items-center gap-2 text-sm text-theme-text-muted">
						<div class="h-1.5 w-1.5 rounded-full bg-green-500"></div>
						Quick workspace switching
					</div>
				</div>
			</div>

			<!-- Error Message -->
			{#if form?.error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-sm text-red-700 dark:text-red-400">
						{form.error}
					</p>
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex justify-end gap-3 pt-4">
				<button
					type="button"
					onclick={() => goto('/settings')}
					class="rounded-lg px-4 py-2 text-sm font-medium text-theme-text transition-colors hover:bg-theme-surface-hover"
					disabled={isSubmitting}
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={isSubmitting || !workspaceName || (workspaceSlug && !isSlugValid)}
					class="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isSubmitting}
						<div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
						Creating...
					{:else}
						<Building2 class="h-4 w-4" />
						Create Workspace
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>