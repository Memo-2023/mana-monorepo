<script lang="ts">
	import { Button, Card } from '@manacore/shared-ui';
	import SectionEditor from './SectionEditor.svelte';
	import RepeatableField from './RepeatableField.svelte';
	import { saveLandingConfig, publishLanding } from '$lib/api/services/landing';
	import type {
		LandingPageConfig,
		LandingAboutFeature,
		LandingTeamMember,
		LandingFooterLink,
		LandingTheme,
	} from '@manacore/shared-types';

	let {
		orgId,
		orgSlug,
		initialConfig,
		existingMetadata = {},
	}: {
		orgId: string;
		orgSlug: string;
		initialConfig?: LandingPageConfig;
		existingMetadata?: Record<string, unknown>;
	} = $props();

	// Default config
	const defaultConfig: LandingPageConfig = {
		enabled: true,
		theme: 'warm',
		sections: {
			hero: { title: '', subtitle: '' },
			about: { title: 'About', features: [] },
			team: { title: 'Team', members: [] },
			contact: { title: 'Contact' },
			footer: {},
		},
	};

	let config: LandingPageConfig = $state(
		initialConfig ? structuredClone(initialConfig) : structuredClone(defaultConfig)
	);

	let saving = $state(false);
	let publishing = $state(false);
	let saveMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function handleSave() {
		saving = true;
		saveMessage = null;

		const result = await saveLandingConfig(orgId, config, existingMetadata);
		if (result.error) {
			saveMessage = { type: 'error', text: result.error };
		} else {
			saveMessage = { type: 'success', text: 'Saved' };
		}
		saving = false;
	}

	async function handlePublish() {
		if (!orgSlug) {
			saveMessage = { type: 'error', text: 'Organization needs a slug to publish' };
			return;
		}

		publishing = true;
		saveMessage = null;

		// Save first
		const saveResult = await saveLandingConfig(orgId, config, existingMetadata);
		if (saveResult.error) {
			saveMessage = { type: 'error', text: saveResult.error };
			publishing = false;
			return;
		}

		// Then build
		const buildResult = await publishLanding(orgId, orgSlug, config);
		if (buildResult.error) {
			saveMessage = { type: 'error', text: `Build failed: ${buildResult.error}` };
		} else if (buildResult.data) {
			config.publishedUrl = buildResult.data.url;
			config.lastBuiltAt = new Date().toISOString();
			config.lastBuildStatus = 'success';
			// Save updated status
			await saveLandingConfig(orgId, config, existingMetadata);
			saveMessage = {
				type: 'success',
				text: `Published at ${buildResult.data.url} (${Math.round((buildResult.data.duration || 0) / 1000)}s)`,
			};
		}
		publishing = false;
	}

	// Helper to add/remove items in arrays
	function addFeature() {
		config.sections.about.features = [
			...config.sections.about.features,
			{ icon: '', title: '', description: '' },
		];
	}

	function removeFeature(index: number) {
		config.sections.about.features = config.sections.about.features.filter((_, i) => i !== index);
	}

	function addMember() {
		config.sections.team.members = [...config.sections.team.members, { name: '', role: '' }];
	}

	function removeMember(index: number) {
		config.sections.team.members = config.sections.team.members.filter((_, i) => i !== index);
	}

	function addFooterLink() {
		config.sections.footer.links = [
			...(config.sections.footer.links || []),
			{ label: '', href: '' },
		];
	}

	function removeFooterLink(index: number) {
		config.sections.footer.links = (config.sections.footer.links || []).filter(
			(_, i) => i !== index
		);
	}
</script>

<div class="space-y-6">
	<!-- Global Settings -->
	<Card>
		<div class="space-y-4">
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>

			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<label
						for="theme"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						Theme
					</label>
					<select
						id="theme"
						bind:value={config.theme}
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					>
						<option value="warm">Warm (Light)</option>
						<option value="classic">Classic (Dark)</option>
					</select>
				</div>

				<div>
					<label
						for="primary-color"
						class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>
						Primary Color (optional)
					</label>
					<div class="flex gap-2">
						<input
							id="primary-color"
							type="color"
							value={config.customColors?.primary ||
								(config.theme === 'warm' ? '#d97706' : '#64748b')}
							oninput={(e) => {
								if (!config.customColors) config.customColors = {};
								config.customColors.primary = (e.target as HTMLInputElement).value;
							}}
							class="h-10 w-14 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
						/>
						<input
							type="text"
							value={config.customColors?.primary || ''}
							placeholder="e.g. #3b82f6"
							oninput={(e) => {
								if (!config.customColors) config.customColors = {};
								config.customColors.primary = (e.target as HTMLInputElement).value;
							}}
							class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						/>
					</div>
				</div>
			</div>
		</div>
	</Card>

	<!-- Hero Section -->
	<SectionEditor title="Hero" expanded={true}>
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
				<input
					type="text"
					bind:value={config.sections.hero.title}
					placeholder="Your organization name"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Subtitle</label
				>
				<textarea
					bind:value={config.sections.hero.subtitle}
					placeholder="A short description of your organization"
					rows="2"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				></textarea>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Variant</label
				>
				<select
					bind:value={config.sections.hero.variant}
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				>
					<option value="centered">Centered</option>
					<option value="default">Split (Text + Image)</option>
					<option value="fullwidth">Full Width</option>
				</select>
			</div>
			<div class="grid gap-3 md:grid-cols-2">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>CTA Button Text</label
					>
					<input
						type="text"
						value={config.sections.hero.primaryCta?.text || ''}
						oninput={(e) => {
							if (!config.sections.hero.primaryCta)
								config.sections.hero.primaryCta = { text: '', href: '#contact' };
							config.sections.hero.primaryCta.text = (e.target as HTMLInputElement).value;
						}}
						placeholder="e.g. Contact us"
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>CTA Button Link</label
					>
					<input
						type="text"
						value={config.sections.hero.primaryCta?.href || ''}
						oninput={(e) => {
							if (!config.sections.hero.primaryCta)
								config.sections.hero.primaryCta = { text: '', href: '' };
							config.sections.hero.primaryCta.href = (e.target as HTMLInputElement).value;
						}}
						placeholder="e.g. #contact or https://..."
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
			</div>
		</div>
	</SectionEditor>

	<!-- About Section -->
	<SectionEditor title="About / Features">
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Section Title</label
				>
				<input
					type="text"
					bind:value={config.sections.about.title}
					placeholder="What we offer"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Subtitle</label
				>
				<input
					type="text"
					bind:value={config.sections.about.subtitle}
					placeholder="Optional subtitle"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>

			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Features</label>
			<RepeatableField
				items={config.sections.about.features}
				onAdd={addFeature}
				onRemove={removeFeature}
				addLabel="Add Feature"
			>
				{#snippet renderItem(feature: LandingAboutFeature, index: number)}
					<div class="grid gap-2 pr-6">
						<div class="grid gap-2 md:grid-cols-[60px_1fr]">
							<input
								type="text"
								bind:value={config.sections.about.features[index].icon}
								placeholder="Icon"
								class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-center"
							/>
							<input
								type="text"
								bind:value={config.sections.about.features[index].title}
								placeholder="Feature title"
								class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
							/>
						</div>
						<textarea
							bind:value={config.sections.about.features[index].description}
							placeholder="Description"
							rows="2"
							class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						></textarea>
					</div>
				{/snippet}
			</RepeatableField>
		</div>
	</SectionEditor>

	<!-- Team Section -->
	<SectionEditor title="Team">
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Section Title</label
				>
				<input
					type="text"
					bind:value={config.sections.team.title}
					placeholder="Our Team"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>

			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Members</label>
			<RepeatableField
				items={config.sections.team.members}
				onAdd={addMember}
				onRemove={removeMember}
				addLabel="Add Member"
			>
				{#snippet renderItem(member: LandingTeamMember, index: number)}
					<div class="grid gap-2 pr-6">
						<div class="grid gap-2 md:grid-cols-2">
							<input
								type="text"
								bind:value={config.sections.team.members[index].name}
								placeholder="Name"
								class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
							/>
							<input
								type="text"
								bind:value={config.sections.team.members[index].role}
								placeholder="Role"
								class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
							/>
						</div>
						<input
							type="text"
							bind:value={config.sections.team.members[index].image}
							placeholder="Image URL (optional)"
							class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						/>
					</div>
				{/snippet}
			</RepeatableField>
		</div>
	</SectionEditor>

	<!-- Contact Section -->
	<SectionEditor title="Contact">
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Section Title</label
				>
				<input
					type="text"
					bind:value={config.sections.contact.title}
					placeholder="Contact"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>
			<div class="grid gap-3 md:grid-cols-2">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>E-Mail</label
					>
					<input
						type="email"
						bind:value={config.sections.contact.email}
						placeholder="info@example.com"
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
						>Phone</label
					>
					<input
						type="tel"
						bind:value={config.sections.contact.phone}
						placeholder="+49 123 456789"
						class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
					/>
				</div>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Address</label
				>
				<textarea
					bind:value={config.sections.contact.address}
					placeholder="Street, City, ZIP"
					rows="2"
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				></textarea>
			</div>
		</div>
	</SectionEditor>

	<!-- Footer Section -->
	<SectionEditor title="Footer">
		<div class="space-y-3">
			<div>
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
					>Copyright Text</label
				>
				<input
					type="text"
					bind:value={config.sections.footer.copyright}
					placeholder="e.g. 2024 My Organization. All rights reserved."
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
				/>
			</div>

			<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Links</label>
			<RepeatableField
				items={config.sections.footer.links || []}
				onAdd={addFooterLink}
				onRemove={removeFooterLink}
				addLabel="Add Link"
			>
				{#snippet renderItem(link: LandingFooterLink, index: number)}
					<div class="grid gap-2 md:grid-cols-2 pr-6">
						<input
							type="text"
							bind:value={link.label}
							placeholder="Label"
							class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						/>
						<input
							type="text"
							bind:value={link.href}
							placeholder="URL"
							class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
						/>
					</div>
				{/snippet}
			</RepeatableField>
		</div>
	</SectionEditor>

	<!-- Status Message -->
	{#if saveMessage}
		<div
			class="rounded-lg px-4 py-3 text-sm {saveMessage.type === 'success'
				? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
				: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}"
		>
			{saveMessage.text}
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="flex items-center gap-3">
		<Button variant="secondary" onclick={handleSave} disabled={saving || publishing}>
			{saving ? 'Saving...' : 'Save'}
		</Button>
		<Button variant="primary" onclick={handlePublish} disabled={saving || publishing}>
			{#if publishing}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
					></div>
					Building...
				</div>
			{:else}
				Publish
			{/if}
		</Button>

		{#if config.publishedUrl}
			<a
				href={config.publishedUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="ml-auto text-sm text-primary-600 hover:underline flex items-center gap-1"
			>
				{config.publishedUrl}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</a>
		{/if}
	</div>
</div>
