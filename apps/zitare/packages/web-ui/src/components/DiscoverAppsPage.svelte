<script lang="ts">
	interface AppInfo {
		name: string;
		displayName: string;
		description: string;
		icon: string;
		color: string;
		url: string;
		features: string[];
	}

	interface Props {
		currentAppName: string;
		pageTitle?: string;
	}

	let { currentAppName, pageTitle = 'Apps entdecken' }: Props = $props();

	const allApps: AppInfo[] = [
		{
			name: 'quotes',
			displayName: 'Zitate',
			description: 'Inspirierende Zitate von großen Denkern und Philosophen',
			icon: '💭',
			color: '#667eea',
			url: 'http://localhost:5173',
			features: ['1000+ Zitate', 'Berühmte Autoren', 'Kategorien & Tags'],
		},
		{
			name: 'proverbs',
			displayName: 'Sprichwörter',
			description: 'Zeitlose Weisheiten und Redewendungen aus aller Welt',
			icon: '📜',
			color: '#f59e0b',
			url: 'http://localhost:5171',
			features: ['Deutsche Sprichwörter', 'Volksweisheiten', 'Redensarten'],
		},
		{
			name: 'poems',
			displayName: 'Gedichte',
			description: 'Klassische und moderne Gedichte der deutschen Literatur',
			icon: '✍️',
			color: '#ec4899',
			url: 'http://localhost:5172',
			features: ['Klassische Gedichte', 'Verschiedene Epochen', 'Berühmte Dichter'],
		},
		{
			name: 'fables',
			displayName: 'Fabeln',
			description: 'Klassische Fabeln von Äsop, La Fontaine und Lessing',
			icon: '🦊',
			color: '#8b5cf6',
			url: 'http://localhost:5174',
			features: ['Äsop Fabeln', 'Moralische Lehren', 'Tiergeschichten'],
		},
	];

	const otherApps = $derived(allApps.filter((app) => app.name !== currentAppName));
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<div class="discover-page">
	<div class="header">
		<h1>{pageTitle}</h1>
		<p class="subtitle">Entdecke weitere Apps aus unserer Sammlung</p>
	</div>

	<div class="apps-grid">
		{#each otherApps as app (app.name)}
			<a href={app.url} target="_blank" rel="noopener noreferrer" class="app-card">
				<div
					class="app-icon"
					style="background: linear-gradient(135deg, {app.color} 0%, {app.color}dd 100%)"
				>
					<span class="icon-emoji">{app.icon}</span>
				</div>

				<div class="app-content">
					<h2 class="app-title">{app.displayName}</h2>
					<p class="app-description">{app.description}</p>

					<div class="app-features">
						{#each app.features as feature}
							<span class="feature-badge">{feature}</span>
						{/each}
					</div>
				</div>

				<div class="app-cta">
					<span class="cta-text">App öffnen</span>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M5 12h14"></path>
						<path d="m12 5 7 7-7 7"></path>
					</svg>
				</div>
			</a>
		{/each}
	</div>

	<div class="info-box">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="10"></circle>
			<path d="M12 16v-4"></path>
			<path d="M12 8h.01"></path>
		</svg>
		<p>
			Alle Apps teilen sich das gleiche moderne Design und nutzen dieselbe Technologie für ein
			einheitliches Erlebnis.
		</p>
	</div>
</div>

<style>
	.discover-page {
		max-width: 1200px;
		margin: 0 auto;
		padding-bottom: var(--spacing-2xl);
	}

	.header {
		text-align: center;
		margin-bottom: var(--spacing-2xl);
	}

	.header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-md) 0;
	}

	.subtitle {
		font-size: 1.125rem;
		color: rgb(var(--color-text-secondary));
		margin: 0;
	}

	.apps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: var(--spacing-xl);
		margin-bottom: var(--spacing-2xl);
	}

	.app-card {
		display: flex;
		flex-direction: column;
		background: rgb(var(--color-surface));
		border: 2px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
		padding: var(--spacing-xl);
		text-decoration: none;
		transition: all var(--transition-base);
		cursor: pointer;
		position: relative;
		overflow: hidden;
	}

	.app-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(
			90deg,
			rgb(var(--color-primary)) 0%,
			rgb(var(--color-primary-dark)) 100%
		);
		opacity: 0;
		transition: opacity var(--transition-base);
	}

	.app-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-xl);
		border-color: rgb(var(--color-primary) / 0.3);
	}

	.app-card:hover::before {
		opacity: 1;
	}

	.app-icon {
		width: 80px;
		height: 80px;
		border-radius: var(--radius-xl);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--spacing-lg);
		box-shadow: var(--shadow-lg);
	}

	.icon-emoji {
		font-size: 2.5rem;
	}

	.app-content {
		flex: 1;
	}

	.app-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: rgb(var(--color-text-primary));
		margin: 0 0 var(--spacing-sm) 0;
	}

	.app-description {
		font-size: 1rem;
		color: rgb(var(--color-text-secondary));
		line-height: 1.6;
		margin: 0 0 var(--spacing-lg) 0;
	}

	.app-features {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-lg);
	}

	.feature-badge {
		display: inline-block;
		padding: var(--spacing-xs) var(--spacing-md);
		background: rgb(var(--color-primary) / 0.1);
		color: rgb(var(--color-primary));
		border-radius: var(--radius-full);
		font-size: 0.875rem;
		font-weight: 500;
	}

	.app-cta {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: rgb(var(--color-primary));
		font-weight: 600;
		margin-top: auto;
	}

	.app-card:hover .app-cta {
		gap: var(--spacing-md);
	}

	.app-card:hover .app-cta svg {
		transform: translateX(4px);
	}

	.app-cta svg {
		transition: transform var(--transition-base);
	}

	.info-box {
		max-width: 700px;
		margin: 0 auto;
		display: flex;
		gap: var(--spacing-md);
		padding: var(--spacing-lg);
		background: rgb(var(--color-primary) / 0.05);
		border: 1px solid rgb(var(--color-primary) / 0.2);
		border-radius: var(--radius-lg);
		color: rgb(var(--color-text-secondary));
	}

	.info-box svg {
		flex-shrink: 0;
		color: rgb(var(--color-primary));
		margin-top: 2px;
	}

	.info-box p {
		margin: 0;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.header h1 {
			font-size: 2rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.apps-grid {
			grid-template-columns: 1fr;
			gap: var(--spacing-lg);
		}

		.app-card {
			padding: var(--spacing-lg);
		}

		.app-icon {
			width: 64px;
			height: 64px;
		}

		.icon-emoji {
			font-size: 2rem;
		}

		.app-title {
			font-size: 1.25rem;
		}

		.app-description {
			font-size: 0.9375rem;
		}

		.info-box {
			flex-direction: column;
			text-align: center;
			padding: var(--spacing-md);
		}

		.info-box svg {
			margin: 0 auto;
		}
	}
</style>
