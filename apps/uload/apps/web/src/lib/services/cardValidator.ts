import type { Card, CardConfig, ValidationResult, Module } from '$lib/components/cards/types';

class CardValidator {
	/**
	 * Validate a complete card
	 */
	validate(card: Card): ValidationResult {
		const errors: Array<{ field: string; message: string }> = [];

		// Validate ID
		if (!card.id || card.id.trim() === '') {
			errors.push({ field: 'id', message: 'Card ID is required' });
		}

		// Validate config
		const configErrors = this.validateConfig(card.config);
		errors.push(...configErrors);

		// Validate constraints
		const constraintErrors = this.validateConstraints(card);
		errors.push(...constraintErrors);

		// Validate metadata
		const metadataErrors = this.validateMetadata(card);
		errors.push(...metadataErrors);

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined
		};
	}

	/**
	 * Validate card configuration based on mode
	 */
	private validateConfig(config: CardConfig): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		if (!config.mode) {
			errors.push({ field: 'config.mode', message: 'Card mode is required' });
			return errors;
		}

		switch (config.mode) {
			case 'beginner':
				errors.push(...this.validateBeginnerConfig(config));
				break;
			case 'advanced':
				errors.push(...this.validateAdvancedConfig(config));
				break;
			case 'expert':
				errors.push(...this.validateExpertConfig(config));
				break;
			default:
				// This should never happen with proper TypeScript types, but kept for runtime safety
				const _exhaustiveCheck: never = config;
				errors.push({ field: 'config.mode', message: `Invalid mode: ${(config as any).mode}` });
		}

		return errors;
	}

	/**
	 * Validate beginner mode configuration
	 */
	private validateBeginnerConfig(
		config: Extract<CardConfig, { mode: 'beginner' }>
	): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		// Validate modules
		if (!Array.isArray(config.modules)) {
			errors.push({ field: 'config.modules', message: 'Modules must be an array' });
		} else {
			// Check module count
			if (config.modules.length === 0) {
				errors.push({ field: 'config.modules', message: 'At least one module is required' });
			}
			if (config.modules.length > 20) {
				errors.push({ field: 'config.modules', message: 'Maximum 20 modules allowed' });
			}

			// Validate each module
			config.modules.forEach((module, index) => {
				errors.push(...this.validateModule(module, index));
			});
		}

		// Validate layout
		if (config.layout) {
			if (config.layout.columns && (config.layout.columns < 1 || config.layout.columns > 4)) {
				errors.push({
					field: 'config.layout.columns',
					message: 'Columns must be between 1 and 4'
				});
			}
		}

		return errors;
	}

	/**
	 * Validate a single module
	 */
	private validateModule(module: Module, index: number): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];
		const prefix = `config.modules[${index}]`;

		if (!module.id) {
			errors.push({ field: `${prefix}.id`, message: 'Module ID is required' });
		}

		if (!module.type) {
			errors.push({ field: `${prefix}.type`, message: 'Module type is required' });
		} else {
			const validTypes = [
				'header',
				'content',
				'footer',
				'media',
				'stats',
				'actions',
				'links',
				'custom'
			];
			if (!validTypes.includes(module.type)) {
				errors.push({ field: `${prefix}.type`, message: `Invalid module type: ${module.type}` });
			}
		}

		if (typeof module.order !== 'number') {
			errors.push({ field: `${prefix}.order`, message: 'Module order must be a number' });
		}

		// Validate module-specific props
		if (module.type === 'links' && module.props) {
			if (!Array.isArray(module.props.links)) {
				errors.push({ field: `${prefix}.props.links`, message: 'Links must be an array' });
			}
		}

		if (module.type === 'media' && module.props) {
			if (!module.props.type) {
				errors.push({ field: `${prefix}.props.type`, message: 'Media type is required' });
			}
			if (module.props.type === 'image' && !module.props.src) {
				errors.push({ field: `${prefix}.props.src`, message: 'Image source is required' });
			}
		}

		return errors;
	}

	/**
	 * Validate advanced mode configuration
	 */
	private validateAdvancedConfig(
		config: Extract<CardConfig, { mode: 'advanced' }>
	): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		// Validate template
		if (!config.template || config.template.trim() === '') {
			errors.push({ field: 'config.template', message: 'Template is required' });
		} else {
			// Check template size
			if (config.template.length > 100000) {
				errors.push({
					field: 'config.template',
					message: 'Template exceeds maximum size of 100KB'
				});
			}

			// Check for dangerous patterns
			if (this.containsDangerousPatterns(config.template)) {
				errors.push({
					field: 'config.template',
					message: 'Template contains potentially dangerous patterns'
				});
			}
		}

		// Validate CSS
		if (config.css) {
			if (config.css.length > 50000) {
				errors.push({
					field: 'config.css',
					message: 'CSS exceeds maximum size of 50KB'
				});
			}

			if (this.containsDangerousCSS(config.css)) {
				errors.push({
					field: 'config.css',
					message: 'CSS contains potentially dangerous patterns'
				});
			}
		}

		// Validate variables
		if (!Array.isArray(config.variables)) {
			errors.push({ field: 'config.variables', message: 'Variables must be an array' });
		} else {
			config.variables.forEach((variable, index) => {
				if (!variable.name) {
					errors.push({
						field: `config.variables[${index}].name`,
						message: 'Variable name is required'
					});
				}
				if (!variable.type) {
					errors.push({
						field: `config.variables[${index}].type`,
						message: 'Variable type is required'
					});
				}
			});
		}

		// Validate values match variables
		if (config.values && config.variables) {
			const requiredVars = config.variables.filter((v) => v.required);
			requiredVars.forEach((variable) => {
				if (!(variable.name in config.values)) {
					errors.push({
						field: `config.values.${variable.name}`,
						message: `Required variable '${variable.name}' is missing`
					});
				}
			});
		}

		return errors;
	}

	/**
	 * Validate expert mode configuration
	 */
	private validateExpertConfig(
		config: Extract<CardConfig, { mode: 'expert' }>
	): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		// Validate HTML
		if (!config.html || config.html.trim() === '') {
			errors.push({ field: 'config.html', message: 'HTML is required' });
		} else {
			if (config.html.length > 100000) {
				errors.push({
					field: 'config.html',
					message: 'HTML exceeds maximum size of 100KB'
				});
			}

			if (this.containsDangerousPatterns(config.html)) {
				errors.push({
					field: 'config.html',
					message: 'HTML contains potentially dangerous patterns'
				});
			}
		}

		// Validate CSS
		if (!config.css || config.css.trim() === '') {
			errors.push({ field: 'config.css', message: 'CSS is required' });
		} else {
			if (config.css.length > 50000) {
				errors.push({
					field: 'config.css',
					message: 'CSS exceeds maximum size of 50KB'
				});
			}

			if (this.containsDangerousCSS(config.css)) {
				errors.push({
					field: 'config.css',
					message: 'CSS contains potentially dangerous patterns'
				});
			}
		}

		// JavaScript is not allowed in expert mode for security
		if (config.javascript) {
			errors.push({
				field: 'config.javascript',
				message: 'JavaScript is not allowed for security reasons'
			});
		}

		return errors;
	}

	/**
	 * Validate card constraints
	 */
	private validateConstraints(card: Card): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		if (!card.constraints) {
			return errors;
		}

		// Validate aspect ratio
		if (card.constraints.aspectRatio) {
			const validRatios = ['16/9', '4/3', '1/1', '3/2', 'auto'];
			if (!validRatios.includes(card.constraints.aspectRatio)) {
				// Check if it's a custom ratio like "21/9"
				const ratioPattern = /^\d+\/\d+$/;
				if (!ratioPattern.test(card.constraints.aspectRatio)) {
					errors.push({
						field: 'constraints.aspectRatio',
						message: 'Invalid aspect ratio format'
					});
				}
			}
		}

		// Validate size constraints
		if (card.constraints.maxModules && card.constraints.maxModules < 1) {
			errors.push({
				field: 'constraints.maxModules',
				message: 'Maximum modules must be at least 1'
			});
		}

		if (card.constraints.maxHTMLSize && card.constraints.maxHTMLSize < 1000) {
			errors.push({
				field: 'constraints.maxHTMLSize',
				message: 'Maximum HTML size must be at least 1KB'
			});
		}

		if (card.constraints.maxCSSSize && card.constraints.maxCSSSize < 1000) {
			errors.push({
				field: 'constraints.maxCSSSize',
				message: 'Maximum CSS size must be at least 1KB'
			});
		}

		return errors;
	}

	/**
	 * Validate card metadata
	 */
	private validateMetadata(card: Card): Array<{ field: string; message: string }> {
		const errors: Array<{ field: string; message: string }> = [];

		if (!card.metadata) {
			return errors;
		}

		// Validate name length
		if (card.metadata.name && card.metadata.name.length > 100) {
			errors.push({
				field: 'metadata.name',
				message: 'Name must be 100 characters or less'
			});
		}

		// Validate description length
		if (card.metadata.description && card.metadata.description.length > 500) {
			errors.push({
				field: 'metadata.description',
				message: 'Description must be 500 characters or less'
			});
		}

		// Validate tags
		if (card.metadata.tags) {
			if (!Array.isArray(card.metadata.tags)) {
				errors.push({
					field: 'metadata.tags',
					message: 'Tags must be an array'
				});
			} else if (card.metadata.tags.length > 10) {
				errors.push({
					field: 'metadata.tags',
					message: 'Maximum 10 tags allowed'
				});
			}
		}

		// Position is now directly on the Card, not in metadata
		// No need to validate here since it's handled at the Card level

		return errors;
	}

	/**
	 * Check for dangerous HTML patterns
	 */
	private containsDangerousPatterns(html: string): boolean {
		const dangerousPatterns = [
			/<script/i,
			/<iframe/i,
			/<object/i,
			/<embed/i,
			/<form/i,
			/javascript:/i,
			/on\w+\s*=/i, // Event handlers
			/<link[^>]*href/i, // External stylesheets
			/<meta[^>]*http-equiv/i // Meta refresh
		];

		return dangerousPatterns.some((pattern) => pattern.test(html));
	}

	/**
	 * Check for dangerous CSS patterns
	 */
	private containsDangerousCSS(css: string): boolean {
		const dangerousPatterns = [
			/@import/i,
			/javascript:/i,
			/expression\s*\(/i,
			/behavior\s*:/i,
			/-moz-binding/i,
			/filter\s*:/i, // IE filters can execute code
			/content\s*:\s*url\s*\(/i // Can load external resources
		];

		return dangerousPatterns.some((pattern) => pattern.test(css));
	}

	/**
	 * Validate a single field
	 */
	validateField(card: Card, fieldPath: string): ValidationResult {
		const errors: Array<{ field: string; message: string }> = [];

		// Parse field path
		const parts = fieldPath.split('.');

		if (parts[0] === 'config') {
			const configErrors = this.validateConfig(card.config);
			errors.push(...configErrors.filter((e) => e.field.startsWith(fieldPath)));
		} else if (parts[0] === 'constraints') {
			const constraintErrors = this.validateConstraints(card);
			errors.push(...constraintErrors.filter((e) => e.field.startsWith(fieldPath)));
		} else if (parts[0] === 'metadata') {
			const metadataErrors = this.validateMetadata(card);
			errors.push(...metadataErrors.filter((e) => e.field.startsWith(fieldPath)));
		}

		return {
			valid: errors.length === 0,
			errors: errors.length > 0 ? errors : undefined
		};
	}
}

// Export singleton instance
export const cardValidator = new CardValidator();
