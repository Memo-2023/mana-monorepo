import type { CardConfig, Module, TemplateVariable } from '$lib/components/cards/types';
import { cardSanitizer } from './cardSanitizer';

class CardConverter {
	/**
	 * Convert any card config to modular (beginner) format
	 */
	async toModular(config: CardConfig): Promise<Extract<CardConfig, { mode: 'beginner' }>> {
		if (config.mode === 'beginner') {
			return config;
		}

		if (config.mode === 'advanced') {
			return this.templateToModular(config);
		}

		if (config.mode === 'expert') {
			return this.customToModular(config);
		}

		throw new Error(`Unknown card mode: ${(config as any).mode}`);
	}

	/**
	 * Convert any card config to template (advanced) format
	 */
	async toTemplate(config: CardConfig): Promise<Extract<CardConfig, { mode: 'advanced' }>> {
		if (config.mode === 'advanced') {
			return config;
		}

		if (config.mode === 'beginner') {
			return this.modularToTemplate(config);
		}

		if (config.mode === 'expert') {
			return this.customToTemplate(config);
		}

		throw new Error(`Unknown card mode: ${(config as any).mode}`);
	}

	/**
	 * Convert any card config to custom (expert) format
	 */
	async toCustom(config: CardConfig): Promise<Extract<CardConfig, { mode: 'expert' }>> {
		if (config.mode === 'expert') {
			return config;
		}

		if (config.mode === 'beginner') {
			return this.modularToCustom(config);
		}

		if (config.mode === 'advanced') {
			return this.templateToCustom(config);
		}

		throw new Error(`Unknown card mode: ${(config as any).mode}`);
	}

	/**
	 * Convert template to modular format
	 */
	private async templateToModular(
		config: Extract<CardConfig, { mode: 'advanced' }>
	): Promise<Extract<CardConfig, { mode: 'beginner' }>> {
		const modules: Module[] = [];
		const parser = new DOMParser();
		const doc = parser.parseFromString(config.template, 'text/html');

		// Analyze HTML structure and extract modules
		let order = 0;

		// Check for headers
		const headers = doc.querySelectorAll('h1, h2, h3');
		if (headers.length > 0) {
			const header = headers[0];
			const subtitle =
				header.nextElementSibling?.tagName === 'P' ? header.nextElementSibling.textContent : '';

			modules.push({
				id: `header_${order++}`,
				type: 'header',
				props: {
					title: header.textContent || '',
					subtitle: subtitle || ''
				},
				order
			});
		}

		// Check for images
		const images = doc.querySelectorAll('img');
		images.forEach((img) => {
			modules.push({
				id: `media_${order++}`,
				type: 'media',
				props: {
					type: 'image',
					src: img.getAttribute('src') || '',
					alt: img.getAttribute('alt') || ''
				},
				order
			});
		});

		// Check for links
		const links = doc.querySelectorAll('a');
		if (links.length > 0) {
			const linkItems = Array.from(links).map((link) => ({
				label: link.textContent || '',
				href: link.getAttribute('href') || '#',
				icon: ''
			}));

			modules.push({
				id: `links_${order++}`,
				type: 'links',
				props: {
					links: linkItems,
					style: 'button'
				},
				order
			});
		}

		// Check for remaining content
		const paragraphs = doc.querySelectorAll('p, div');
		if (paragraphs.length > 0) {
			const content = Array.from(paragraphs)
				.map((p) => p.textContent)
				.filter((text) => text && text.trim())
				.join('\n\n');

			if (content) {
				modules.push({
					id: `content_${order++}`,
					type: 'content',
					props: {
						text: content
					},
					order
				});
			}
		}

		return {
			mode: 'beginner',
			modules,
			theme: this.extractThemeFromCSS(config.css),
			layout: {
				columns: 1,
				gap: '1rem',
				padding: '1.5rem'
			}
		};
	}

	/**
	 * Convert custom HTML to modular format
	 */
	private async customToModular(
		config: Extract<CardConfig, { mode: 'expert' }>
	): Promise<Extract<CardConfig, { mode: 'beginner' }>> {
		// Similar to templateToModular but without variables
		const templateConfig: Extract<CardConfig, { mode: 'advanced' }> = {
			mode: 'advanced',
			template: config.html,
			css: config.css,
			variables: [],
			values: {}
		};

		return this.templateToModular(templateConfig);
	}

	/**
	 * Convert modular to template format
	 */
	private modularToTemplate(
		config: Extract<CardConfig, { mode: 'beginner' }>
	): Extract<CardConfig, { mode: 'advanced' }> {
		let template = '<div class="card-content">\n';
		const variables: TemplateVariable[] = [];
		const values: Record<string, any> = {};

		// Convert each module to template HTML
		config.modules.forEach((module) => {
			switch (module.type) {
				case 'header':
					if (module.props.title) {
						template += `  <h2>{{title}}</h2>\n`;
						variables.push({
							name: 'title',
							type: 'text',
							label: 'Title',
							default: module.props.title
						});
						values.title = module.props.title;
					}
					if (module.props.subtitle) {
						template += `  <p class="subtitle">{{subtitle}}</p>\n`;
						variables.push({
							name: 'subtitle',
							type: 'text',
							label: 'Subtitle',
							default: module.props.subtitle
						});
						values.subtitle = module.props.subtitle;
					}
					break;

				case 'content':
					template += `  <div class="content">{{content}}</div>\n`;
					variables.push({
						name: 'content',
						type: 'text',
						label: 'Content',
						default: module.props.text || module.props.html
					});
					values.content = module.props.text || module.props.html;
					break;

				case 'media':
					if (module.props.type === 'image') {
						template += `  <img src="{{image_url}}" alt="{{image_alt}}" class="media-image">\n`;
						variables.push(
							{
								name: 'image_url',
								type: 'image',
								label: 'Image URL',
								default: module.props.src
							},
							{
								name: 'image_alt',
								type: 'text',
								label: 'Image Alt Text',
								default: module.props.alt
							}
						);
						values.image_url = module.props.src;
						values.image_alt = module.props.alt;
					}
					break;

				case 'links':
					template += `  <div class="links">\n`;
					module.props.links?.forEach((link: any, index: number) => {
						template += `    <a href="{{link${index}_url}}" class="link-button">{{link${index}_text}}</a>\n`;
						variables.push(
							{
								name: `link${index}_url`,
								type: 'link',
								label: `Link ${index + 1} URL`,
								default: link.href
							},
							{
								name: `link${index}_text`,
								type: 'text',
								label: `Link ${index + 1} Text`,
								default: link.label
							}
						);
						values[`link${index}_url`] = link.href;
						values[`link${index}_text`] = link.label;
					});
					template += `  </div>\n`;
					break;

				case 'stats':
					template += `  <div class="stats">\n`;
					module.props.stats?.forEach((stat: any, index: number) => {
						template += `    <div class="stat-item">\n`;
						template += `      <span class="stat-value">{{stat${index}_value}}</span>\n`;
						template += `      <span class="stat-label">{{stat${index}_label}}</span>\n`;
						template += `    </div>\n`;
						variables.push(
							{
								name: `stat${index}_value`,
								type: 'number',
								label: `Stat ${index + 1} Value`,
								default: stat.value
							},
							{
								name: `stat${index}_label`,
								type: 'text',
								label: `Stat ${index + 1} Label`,
								default: stat.label
							}
						);
						values[`stat${index}_value`] = stat.value;
						values[`stat${index}_label`] = stat.label;
					});
					template += `  </div>\n`;
					break;
			}
		});

		template += '</div>';

		// Generate CSS from theme
		const css = this.generateCSSFromTheme(config.theme);

		return {
			mode: 'advanced',
			template,
			css,
			variables,
			values
		};
	}

	/**
	 * Convert custom HTML to template format
	 */
	private async customToTemplate(
		config: Extract<CardConfig, { mode: 'expert' }>
	): Promise<Extract<CardConfig, { mode: 'advanced' }>> {
		// Extract variables from HTML
		const variables = cardSanitizer.extractVariables(config.html);
		const values: Record<string, any> = {};

		// Set default values
		variables.forEach((variable) => {
			values[variable.name] = variable.default || '';
		});

		return {
			mode: 'advanced',
			template: config.html,
			css: config.css,
			variables,
			values
		};
	}

	/**
	 * Convert modular to custom HTML format
	 */
	private modularToCustom(
		config: Extract<CardConfig, { mode: 'beginner' }>
	): Extract<CardConfig, { mode: 'expert' }> {
		// First convert to template
		const templateConfig = this.modularToTemplate(config);

		// Then replace variables with actual values
		let html = cardSanitizer.replaceVariables(templateConfig.template, templateConfig.values);

		return {
			mode: 'expert',
			html,
			css: templateConfig.css || ''
		};
	}

	/**
	 * Convert template to custom HTML format
	 */
	private templateToCustom(
		config: Extract<CardConfig, { mode: 'advanced' }>
	): Extract<CardConfig, { mode: 'expert' }> {
		// Replace variables with actual values
		const html = cardSanitizer.replaceVariables(config.template, config.values);

		return {
			mode: 'expert',
			html,
			css: config.css || ''
		};
	}

	/**
	 * Extract theme from CSS
	 */
	private extractThemeFromCSS(css?: string): any {
		if (!css) return undefined;

		const theme: any = {
			colors: {}
		};

		// Extract color variables
		const colorRegex = /--([^:]+):\s*([^;]+);/g;
		let match;
		while ((match = colorRegex.exec(css)) !== null) {
			const varName = match[1].trim();
			const value = match[2].trim();
			if (varName.includes('color') || varName.includes('bg')) {
				theme.colors[varName] = value;
			}
		}

		return Object.keys(theme.colors).length > 0 ? theme : undefined;
	}

	/**
	 * Generate CSS from theme
	 */
	private generateCSSFromTheme(theme?: any): string {
		let css = `
.card-content {
	padding: 1.5rem;
	height: 100%;
}

h2 {
	margin-bottom: 0.5rem;
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--text-primary, #1f2937);
}

.subtitle {
	color: var(--text-muted, #6b7280);
	margin-bottom: 1rem;
}

.content {
	margin: 1rem 0;
	line-height: 1.6;
	color: var(--text-primary, #1f2937);
}

.links {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 1rem;
}

.link-button {
	padding: 0.5rem 1rem;
	background: var(--primary, #3b82f6);
	color: white;
	text-decoration: none;
	border-radius: 0.375rem;
	transition: background 0.2s;
}

.link-button:hover {
	background: var(--primary-dark, #2563eb);
}

.media-image {
	width: 100%;
	height: auto;
	border-radius: 0.5rem;
	margin: 1rem 0;
}

.stats {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 1rem;
	margin: 1rem 0;
}

.stat-item {
	text-align: center;
	padding: 1rem;
	background: var(--bg-secondary, #f9fafb);
	border-radius: 0.5rem;
}

.stat-value {
	display: block;
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--primary, #3b82f6);
}

.stat-label {
	display: block;
	font-size: 0.875rem;
	color: var(--text-muted, #6b7280);
	margin-top: 0.25rem;
}`;

		// Add theme variables if available
		if (theme?.colors) {
			const vars = Object.entries(theme.colors)
				.map(([key, value]) => `  --${key}: ${value};`)
				.join('\n');

			css = `:root {\n${vars}\n}\n\n${css}`;
		}

		return css;
	}
}

// Export singleton instance
export const cardConverter = new CardConverter();
