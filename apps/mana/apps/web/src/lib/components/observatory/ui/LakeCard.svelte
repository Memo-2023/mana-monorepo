<script lang="ts">
	import type { LakeData } from '../data/types';

	let { lake }: { lake: LakeData } = $props();

	// Normalize the lake path to fit inside the card SVG
	// We'll render it at its original scale but crop via viewBox
	let viewBox = $derived(() => {
		// Parse path to get rough bounds
		const nums = lake.path.match(/[\d.]+/g)?.map(Number) || [];
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (let i = 0; i < nums.length; i += 2) {
			if (nums[i] < minX) minX = nums[i];
			if (nums[i] > maxX) maxX = nums[i];
		}
		for (let i = 1; i < nums.length; i += 2) {
			if (nums[i] < minY) minY = nums[i];
			if (nums[i] > maxY) maxY = nums[i];
		}
		const pad = 20;
		return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
	});

	const lakeDescriptions: Record<string, string> = {
		auth: 'Zentraler Authentifizierungs-Hub. Alle Services fliessen durch diesen See.',
		redis: 'Schneller Cache-Speicher. Klein, kristallklar, sofort verfugbar.',
		minio: 'Objekt-Speicher fur Dateien, Bilder und Medien aller Apps.',
		'db-left': 'PostgreSQL-Datenbanken fur Calendar, Todo, Contacts, Storage.',
		'db-center': 'PostgreSQL-Datenbanken fur Quotes, Music, Clock, Food.',
		'db-right': 'PostgreSQL-Datenbanken fur Photos, SkillTree, Context, Plants.',
	};

	const lakeIcons: Record<string, string> = {
		auth: 'Mana Core Auth',
		redis: 'Redis Cache',
		minio: 'MinIO Storage',
		'db-left': 'PostgreSQL West',
		'db-center': 'PostgreSQL Mitte',
		'db-right': 'PostgreSQL Ost',
	};
</script>

<div class="lake-card">
	<!-- Lake SVG preview -->
	<div class="lake-preview">
		<svg
			width="220"
			height="120"
			viewBox={viewBox()}
			preserveAspectRatio="xMidYMid meet"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<radialGradient id="lc-{lake.id}" cx="50%" cy="40%" r="60%">
					<stop offset="0%" stop-color={lake.color} />
					<stop offset="100%" stop-color={lake.colorDeep} />
				</radialGradient>
			</defs>
			<path d={lake.path} fill="url(#lc-{lake.id})" />
			<!-- Shimmer -->
			<path d={lake.path} fill="white" opacity="0.08" />
			<!-- Waves -->
			<path
				d={lake.path}
				fill="none"
				stroke="white"
				stroke-width="0.8"
				stroke-dasharray="4 12"
				opacity="0.2"
			>
				<animate
					attributeName="stroke-dashoffset"
					values="0;16"
					dur="4s"
					repeatCount="indefinite"
				/>
			</path>
		</svg>
	</div>

	<!-- Info -->
	<div class="lake-info">
		<h3 class="lake-name">{lake.label}</h3>
		<span class="lake-service">{lakeIcons[lake.id] || lake.name}</span>
		<p class="lake-desc">{lakeDescriptions[lake.id] || ''}</p>
		<div class="lake-stats">
			<span class="lake-stat">
				<span class="stat-label">Klarheit</span>
				<span class="stat-value">{Math.round(lake.clarity * 100)}%</span>
			</span>
			<span class="lake-stat">
				<span class="stat-label">Fullstand</span>
				<span class="stat-value">{Math.round(lake.level * 100)}%</span>
			</span>
		</div>
	</div>
</div>

<style>
	.lake-card {
		flex-shrink: 0;
		width: 260px;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(8px);
		border: 1px solid rgba(148, 163, 184, 0.1);
		border-radius: 12px;
		overflow: hidden;
		transition:
			transform 0.2s,
			border-color 0.2s;
	}

	.lake-card:hover {
		transform: translateY(-3px);
		border-color: rgba(59, 130, 246, 0.2);
	}

	.lake-preview {
		display: flex;
		justify-content: center;
		align-items: center;
		background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
		padding: 12px;
	}

	.lake-info {
		padding: 12px 14px;
	}

	.lake-name {
		font-size: 15px;
		font-weight: 600;
		color: #f1f5f9;
		margin: 0 0 2px 0;
	}

	.lake-service {
		font-size: 11px;
		color: #60a5fa;
		font-weight: 500;
	}

	.lake-desc {
		font-size: 11px;
		color: #94a3b8;
		margin: 8px 0;
		line-height: 1.4;
	}

	.lake-stats {
		display: flex;
		gap: 16px;
	}

	.lake-stat {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.stat-label {
		font-size: 9px;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 13px;
		font-weight: 600;
		color: #cbd5e1;
		font-variant-numeric: tabular-nums;
	}
</style>
