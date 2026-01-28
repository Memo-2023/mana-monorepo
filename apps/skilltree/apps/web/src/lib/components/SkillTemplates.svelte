<script lang="ts">
	import type { Skill, SkillBranch } from '$lib/types';
	import { BRANCH_INFO } from '$lib/types';
	import { X, Plus, Sparkles } from 'lucide-svelte';

	interface Props {
		onClose: () => void;
		onAddSkill: (skill: Partial<Skill>) => Promise<void>;
	}

	let { onClose, onAddSkill }: Props = $props();

	interface SkillTemplate {
		name: string;
		description: string;
		branch: SkillBranch;
	}

	const templates: Record<string, SkillTemplate[]> = {
		'Web Developer': [
			{ name: 'HTML & CSS', description: 'Grundlagen der Webentwicklung', branch: 'intellect' },
			{ name: 'JavaScript', description: 'Die Sprache des Webs', branch: 'intellect' },
			{ name: 'TypeScript', description: 'Typsicheres JavaScript', branch: 'intellect' },
			{ name: 'React', description: 'UI-Bibliothek für moderne Apps', branch: 'intellect' },
			{ name: 'Node.js', description: 'Backend mit JavaScript', branch: 'intellect' },
			{ name: 'Git', description: 'Versionskontrolle', branch: 'practical' },
		],
		'Fitness & Gesundheit': [
			{ name: 'Krafttraining', description: 'Muskelaufbau und Stärke', branch: 'body' },
			{ name: 'Ausdauer', description: 'Cardio und Kondition', branch: 'body' },
			{ name: 'Yoga', description: 'Flexibilität und Balance', branch: 'body' },
			{ name: 'Ernährung', description: 'Gesunde Essgewohnheiten', branch: 'body' },
			{ name: 'Schlaf', description: 'Erholsamer Schlaf', branch: 'mindset' },
			{ name: 'Stressmanagement', description: 'Umgang mit Stress', branch: 'mindset' },
		],
		'Kreative Künste': [
			{ name: 'Zeichnen', description: 'Grundlagen des Zeichnens', branch: 'creativity' },
			{ name: 'Malen', description: 'Farben und Techniken', branch: 'creativity' },
			{ name: 'Fotografie', description: 'Bilder einfangen', branch: 'creativity' },
			{ name: 'Musik', description: 'Instrument spielen', branch: 'creativity' },
			{ name: 'Schreiben', description: 'Kreatives Schreiben', branch: 'creativity' },
			{ name: 'Design', description: 'Visuelles Design', branch: 'creativity' },
		],
		'Sprachen': [
			{ name: 'Englisch', description: 'Die Weltsprache', branch: 'intellect' },
			{ name: 'Spanisch', description: 'Spanisch sprechen', branch: 'intellect' },
			{ name: 'Französisch', description: 'La langue française', branch: 'intellect' },
			{ name: 'Japanisch', description: '日本語', branch: 'intellect' },
			{ name: 'Deutsch', description: 'Deutsche Sprache', branch: 'intellect' },
		],
		'Produktivität': [
			{ name: 'Zeitmanagement', description: 'Zeit effektiv nutzen', branch: 'mindset' },
			{ name: 'Fokus', description: 'Konzentration verbessern', branch: 'mindset' },
			{ name: 'Organisation', description: 'Ordnung und Struktur', branch: 'practical' },
			{ name: 'Kommunikation', description: 'Klar kommunizieren', branch: 'social' },
			{ name: 'Problemlösung', description: 'Analytisches Denken', branch: 'intellect' },
		],
		'Kochen & Haushalt': [
			{ name: 'Kochen', description: 'Leckere Gerichte zubereiten', branch: 'practical' },
			{ name: 'Backen', description: 'Süßes und Brot', branch: 'practical' },
			{ name: 'Haushaltsführung', description: 'Sauberkeit und Ordnung', branch: 'practical' },
			{ name: 'Gartenarbeit', description: 'Grüner Daumen', branch: 'practical' },
			{ name: 'Heimwerken', description: 'Reparaturen selbst machen', branch: 'practical' },
		],
	};

	let selectedTemplate = $state<string | null>(null);
	let addedSkills = $state<Set<string>>(new Set());
	let adding = $state(false);

	async function addSkill(template: SkillTemplate) {
		if (addedSkills.has(template.name)) return;

		adding = true;
		try {
			await onAddSkill(template);
			addedSkills = new Set([...addedSkills, template.name]);
		} finally {
			adding = false;
		}
	}

	async function addAllFromTemplate(templateName: string) {
		const skills = templates[templateName];
		if (!skills) return;

		adding = true;
		try {
			for (const skill of skills) {
				if (!addedSkills.has(skill.name)) {
					await onAddSkill(skill);
					addedSkills = new Set([...addedSkills, skill.name]);
				}
			}
		} finally {
			adding = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4"
	onclick={handleBackdropClick}
	role="dialog"
	aria-modal="true"
>
	<div class="w-full max-w-2xl rounded-2xl border border-gray-700 bg-gray-800 p-6 shadow-xl my-8">
		<!-- Header -->
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-6 w-6 text-yellow-500" />
				<h2 class="text-xl font-bold text-white">Skill-Vorlagen</h2>
			</div>
			<button
				onclick={onClose}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<p class="mb-6 text-gray-400">
			Starte schnell mit vorgefertigten Skill-Sets. Wähle eine Vorlage und füge einzelne Skills oder alle auf einmal hinzu.
		</p>

		<!-- Template List -->
		<div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
			{#each Object.entries(templates) as [name, skills]}
				<div class="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden">
					<!-- Template Header -->
					<button
						onclick={() => (selectedTemplate = selectedTemplate === name ? null : name)}
						class="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors"
					>
						<div>
							<h3 class="font-semibold text-white">{name}</h3>
							<p class="text-sm text-gray-400">{skills.length} Skills</p>
						</div>
						<div class="flex items-center gap-2">
							<button
								onclick={(e) => {
									e.stopPropagation();
									addAllFromTemplate(name);
								}}
								disabled={adding}
								class="rounded-lg bg-emerald-600/20 px-3 py-1.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30 disabled:opacity-50"
							>
								Alle hinzufügen
							</button>
							<span class="text-gray-500 text-xl">
								{selectedTemplate === name ? '−' : '+'}
							</span>
						</div>
					</button>

					<!-- Expanded Skills -->
					{#if selectedTemplate === name}
						<div class="border-t border-gray-700 p-4 space-y-2">
							{#each skills as skill}
								{@const isAdded = addedSkills.has(skill.name)}
								<div class="flex items-center justify-between rounded-lg bg-gray-800/50 px-3 py-2">
									<div class="flex items-center gap-3">
										<span
											class="h-3 w-3 rounded-full"
											style="background-color: {BRANCH_INFO[skill.branch].color}"
										></span>
										<div>
											<span class="font-medium text-white">{skill.name}</span>
											<span class="text-gray-400 text-sm"> - {skill.description}</span>
										</div>
									</div>
									<button
										onclick={() => addSkill(skill)}
										disabled={isAdded || adding}
										class="rounded-lg p-1.5 transition-colors {isAdded
											? 'bg-emerald-600/20 text-emerald-400'
											: 'bg-gray-700 text-gray-300 hover:bg-gray-600'}"
									>
										{#if isAdded}
											<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
											</svg>
										{:else}
											<Plus class="h-4 w-4" />
										{/if}
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Footer -->
		<div class="mt-6 flex justify-end">
			<button
				onclick={onClose}
				class="rounded-lg bg-gray-700 px-4 py-2 font-medium text-white transition-colors hover:bg-gray-600"
			>
				Fertig
			</button>
		</div>
	</div>
</div>
