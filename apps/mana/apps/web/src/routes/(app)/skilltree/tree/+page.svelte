<script lang="ts">
	import { useAllSkills } from '$lib/modules/skilltree/queries';
	import { BRANCH_INFO, LEVEL_NAMES } from '$lib/modules/skilltree/types';
	import type { SkillBranch } from '$lib/modules/skilltree/types';
	import { ArrowLeft, Star } from '@mana/shared-icons';
	import { RoutePage } from '$lib/components/shell';

	// Reactive live query
	const allSkills = useAllSkills();
	const skills = $derived(allSkills.value);

	// Group skills by branch for radial layout
	const branches = Object.keys(BRANCH_INFO) as SkillBranch[];

	// Calculate position for each branch (radial layout)
	function getBranchPosition(branchIndex: number, total: number) {
		const angle = (branchIndex / total) * 2 * Math.PI - Math.PI / 2;
		const radius = 280;
		return {
			x: 400 + Math.cos(angle) * radius,
			y: 400 + Math.sin(angle) * radius,
			angle: (angle * 180) / Math.PI,
		};
	}

	// Calculate skill position within a branch
	function getSkillPosition(
		branchIndex: number,
		skillIndex: number,
		skillCount: number,
		total: number
	) {
		const branchAngle = (branchIndex / total) * 2 * Math.PI - Math.PI / 2;
		const spreadAngle = 0.3;
		const baseRadius = 180;
		const radiusStep = 60;

		const skillAngle =
			branchAngle +
			(skillIndex - (skillCount - 1) / 2) * (spreadAngle / Math.max(skillCount - 1, 1));
		const radius = baseRadius + skillIndex * radiusStep * 0.3;

		return {
			x: 400 + Math.cos(skillAngle) * radius,
			y: 400 + Math.sin(skillAngle) * radius,
		};
	}

	function getLevelColor(level: number): string {
		const colors = ['#6b7280', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#fbbf24'];
		return colors[level] ?? colors[0];
	}

	function getNodeSize(level: number): number {
		return 24 + level * 6;
	}
</script>

<svelte:head>
	<title>Skill Tree View - SkillTree</title>
</svelte:head>

<RoutePage appId="skilltree" backHref="/skilltree">
	<div class="min-h-screen bg-card text-white">
		<!-- Header -->
		<header class="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
			<div class="mx-auto max-w-7xl px-4 py-4">
				<div class="flex items-center gap-4">
					<a
						href="/skilltree"
						class="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-card hover:text-white"
					>
						<ArrowLeft class="h-5 w-5" />
						Zurück
					</a>
					<h1 class="text-xl font-bold">Skill Tree Visualisierung</h1>
				</div>
			</div>
		</header>

		<main class="p-4">
			{#if skills.length === 0}
				<div class="mt-16 text-center">
					<p class="text-muted-foreground">
						Noch keine Skills vorhanden. Erstelle zuerst einige Skills!
					</p>
					<a
						href="/skilltree"
						class="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
					>
						Skills erstellen
					</a>
				</div>
			{:else}
				<!-- Legend -->
				<div class="mb-6 flex flex-wrap justify-center gap-4">
					{#each Object.entries(BRANCH_INFO) as [branch, info]}
						{@const count = skills.filter((s) => s.branch === branch).length}
						{#if count > 0}
							<div class="flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm">
								<span class="h-3 w-3 rounded-full" style="background-color: {info.color}"></span>
								{info.name} ({count})
							</div>
						{/if}
					{/each}
				</div>

				<!-- Tree SVG -->
				<div class="flex justify-center overflow-auto">
					<svg
						viewBox="0 0 800 800"
						class="max-w-full"
						style="min-width: 600px; height: auto; max-height: 80vh;"
					>
						<!-- Background circles -->
						<circle
							cx="400"
							cy="400"
							r="120"
							fill="none"
							stroke="#374151"
							stroke-width="1"
							stroke-dasharray="4"
						/>
						<circle
							cx="400"
							cy="400"
							r="200"
							fill="none"
							stroke="#374151"
							stroke-width="1"
							stroke-dasharray="4"
						/>
						<circle
							cx="400"
							cy="400"
							r="280"
							fill="none"
							stroke="#374151"
							stroke-width="1"
							stroke-dasharray="4"
						/>

						<!-- Center node -->
						<circle cx="400" cy="400" r="50" fill="#10b981" opacity="0.2" />
						<circle cx="400" cy="400" r="40" fill="#10b981" opacity="0.4" />
						<circle cx="400" cy="400" r="30" fill="#10b981" />
						<text
							x="400"
							y="405"
							text-anchor="middle"
							fill="white"
							font-size="12"
							font-weight="bold"
						>
							YOU
						</text>

						<!-- Branch lines and labels -->
						{#each branches as branch, i}
							{@const pos = getBranchPosition(i, branches.length)}
							{@const branchSkills = skills.filter((s) => s.branch === branch)}
							{#if branchSkills.length > 0}
								<!-- Line from center to branch -->
								<line
									x1="400"
									y1="400"
									x2={pos.x}
									y2={pos.y}
									stroke={BRANCH_INFO[branch].color}
									stroke-width="2"
									opacity="0.3"
								/>

								<!-- Branch label -->
								<text
									x={pos.x}
									y={pos.y}
									text-anchor="middle"
									fill={BRANCH_INFO[branch].color}
									font-size="14"
									font-weight="bold"
									dy="-20"
								>
									{BRANCH_INFO[branch].name}
								</text>

								<!-- Skills in this branch -->
								{#each branchSkills as skill, j}
									{@const skillPos = getSkillPosition(i, j, branchSkills.length, branches.length)}
									{@const size = getNodeSize(skill.level)}

									<!-- Connection line -->
									<line
										x1="400"
										y1="400"
										x2={skillPos.x}
										y2={skillPos.y}
										stroke={BRANCH_INFO[branch].color}
										stroke-width="1"
										opacity="0.2"
									/>

									<!-- Skill node -->
									<g
										class="tree-node cursor-pointer"
										transform="translate({skillPos.x}, {skillPos.y})"
									>
										<!-- Glow effect for high level -->
										{#if skill.level >= 4}
											<circle
												r={size + 8}
												fill={getLevelColor(skill.level)}
												opacity="0.2"
												class="animate-pulse"
											/>
										{/if}

										<!-- Node background -->
										<circle
											r={size}
											fill="#1f2937"
											stroke={getLevelColor(skill.level)}
											stroke-width="3"
										/>

										<!-- Level indicator -->
										<text
											text-anchor="middle"
											dy="5"
											fill={getLevelColor(skill.level)}
											font-size="14"
											font-weight="bold"
										>
											{skill.level}
										</text>

										<!-- Skill name (on hover/always for important skills) -->
										<title>{skill.name} (Level {skill.level} - {skill.totalXp} XP)</title>
									</g>

									<!-- Skill label -->
									<text
										x={skillPos.x}
										y={skillPos.y + size + 16}
										text-anchor="middle"
										fill="#9ca3af"
										font-size="10"
										class="pointer-events-none"
									>
										{skill.name.length > 12 ? skill.name.slice(0, 12) + '...' : skill.name}
									</text>
								{/each}
							{/if}
						{/each}
					</svg>
				</div>

				<!-- Level Legend -->
				<div class="mt-8 flex flex-wrap justify-center gap-4">
					{#each LEVEL_NAMES as name, level}
						<div class="flex items-center gap-2 text-sm">
							<div
								class="flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold"
								style="border-color: {getLevelColor(level)}; color: {getLevelColor(level)}"
							>
								{level}
							</div>
							<span class="text-muted-foreground">{name}</span>
						</div>
					{/each}
				</div>
			{/if}
		</main>
	</div>
</RoutePage>

<style>
	.tree-node {
		transition: transform 0.2s ease;
	}
	.tree-node:hover {
		transform: scale(1.15);
	}
</style>
