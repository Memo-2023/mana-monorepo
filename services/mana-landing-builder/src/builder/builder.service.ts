import {
	Injectable,
	Logger,
	ConflictException,
	InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BuildLandingDto } from './dto/build-landing.dto';
import * as path from 'path';
import * as fs from 'fs-extra';
import { execSync } from 'child_process';
import type { LandingPageConfig } from '@mana/shared-types';

export interface BuildResult {
	success: boolean;
	url?: string;
	error?: string;
	duration?: number;
}

@Injectable()
export class BuilderService {
	private readonly logger = new Logger(BuilderService.name);
	private readonly activeBuilds = new Set<string>();

	// Path to the template project inside the service
	private readonly templateDir = path.join(__dirname, '..', '..', 'template');

	// Temp builds go into a .builds directory at service root
	private readonly buildsDir = path.join(__dirname, '..', '..', '.builds');

	constructor(private readonly configService: ConfigService) {}

	async build(dto: BuildLandingDto): Promise<BuildResult> {
		const { slug, config } = dto;
		const landingConfig = config as unknown as LandingPageConfig;

		// Prevent concurrent builds for same org
		if (this.activeBuilds.has(slug)) {
			throw new ConflictException(`Build already in progress for ${slug}`);
		}

		this.activeBuilds.add(slug);
		const startTime = Date.now();
		const workDir = path.join(this.buildsDir, `org-${slug}-${Date.now()}`);

		try {
			// 1. Copy template to work directory
			this.logger.log(`[${slug}] Copying template to ${workDir}`);
			await fs.ensureDir(this.buildsDir);
			await fs.copy(this.templateDir, workDir);

			// 2. Write config.json
			const configPath = path.join(workDir, 'src', 'data', 'config.json');
			await fs.ensureDir(path.dirname(configPath));
			await fs.writeJson(configPath, {
				hero: landingConfig.sections.hero,
				about: landingConfig.sections.about,
				team: landingConfig.sections.team,
				contact: landingConfig.sections.contact,
				footer: landingConfig.sections.footer,
			});
			this.logger.log(`[${slug}] Config written`);

			// 3. Generate theme.css
			const themeCss = this.generateThemeCss(landingConfig);
			const themePath = path.join(workDir, 'src', 'styles', 'theme.css');
			await fs.ensureDir(path.dirname(themePath));
			await fs.writeFile(themePath, themeCss);
			this.logger.log(`[${slug}] Theme CSS generated (${landingConfig.theme})`);

			// 4. Install dependencies
			this.logger.log(`[${slug}] Installing dependencies...`);
			this.exec('pnpm install --frozen-lockfile', workDir);

			// 5. Build Astro site
			this.logger.log(`[${slug}] Building Astro site...`);
			this.exec('npx astro build', workDir);

			const distDir = path.join(workDir, 'dist');
			if (!(await fs.pathExists(distDir))) {
				throw new Error('Astro build did not produce a dist directory');
			}

			// 6. Deploy to Cloudflare Pages
			const projectName = `org-${slug}`;
			const domain = this.configService.get<string>('orgLandingDomain', 'mana.how');
			const url = `https://${slug}.${domain}`;

			if (this.configService.get<string>('cloudflare.apiToken')) {
				this.logger.log(`[${slug}] Deploying to Cloudflare Pages...`);
				this.deployToCloudflare(distDir, projectName, slug, domain);
			} else {
				this.logger.warn(
					`[${slug}] Skipping Cloudflare deploy (no API token configured). ` +
						`Output at: ${distDir}`
				);
			}

			const duration = Date.now() - startTime;
			this.logger.log(`[${slug}] Build complete in ${duration}ms`);

			return {
				success: true,
				url,
				duration,
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`[${slug}] Build failed: ${message}`);
			throw new InternalServerErrorException(`Build failed: ${message}`);
		} finally {
			this.activeBuilds.delete(slug);

			// Clean up work directory
			try {
				await fs.remove(workDir);
			} catch {
				this.logger.warn(`[${slug}] Failed to clean up ${workDir}`);
			}
		}
	}

	private generateThemeCss(config: LandingPageConfig): string {
		// Load base theme colors
		const themes: Record<string, Record<string, string>> = {
			classic: {
				'--color-primary': '#64748b',
				'--color-primary-hover': '#475569',
				'--color-primary-glow': 'rgba(100, 116, 139, 0.3)',
				'--color-text-primary': '#f1f5f9',
				'--color-text-secondary': '#cbd5e1',
				'--color-text-muted': '#64748b',
				'--color-background-page': '#0f172a',
				'--color-background-card': '#1e293b',
				'--color-background-card-hover': '#334155',
				'--color-border': '#334155',
				'--color-border-hover': '#475569',
			},
			warm: {
				'--color-primary': '#d97706',
				'--color-primary-hover': '#b45309',
				'--color-primary-glow': 'rgba(217, 119, 6, 0.2)',
				'--color-text-primary': '#1c1917',
				'--color-text-secondary': '#44403c',
				'--color-text-muted': '#78716c',
				'--color-background-page': '#fafaf9',
				'--color-background-card': '#ffffff',
				'--color-background-card-hover': '#f5f5f4',
				'--color-border': '#e7e5e4',
				'--color-border-hover': '#d6d3d1',
			},
		};

		const colors = { ...themes[config.theme] };

		// Apply custom color overrides
		if (config.customColors?.primary) {
			colors['--color-primary'] = config.customColors.primary;
		}
		if (config.customColors?.primaryHover) {
			colors['--color-primary-hover'] = config.customColors.primaryHover;
		}
		if (config.customColors?.primaryGlow) {
			colors['--color-primary-glow'] = config.customColors.primaryGlow;
		}

		const cssVars = Object.entries(colors)
			.map(([key, value]) => `  ${key}: ${value};`)
			.join('\n');

		return `:root {\n${cssVars}\n}\n`;
	}

	private deployToCloudflare(
		distDir: string,
		projectName: string,
		slug: string,
		domain: string
	): void {
		const accountId = this.configService.get<string>('cloudflare.accountId');
		const apiToken = this.configService.get<string>('cloudflare.apiToken');

		const env = {
			...process.env,
			CLOUDFLARE_API_TOKEN: apiToken,
			CLOUDFLARE_ACCOUNT_ID: accountId,
		};

		// Create project if it doesn't exist (ignore error if already exists)
		try {
			this.exec(
				`npx wrangler pages project create ${projectName} --production-branch=main`,
				distDir,
				env
			);
		} catch {
			// Project likely already exists, continue
		}

		// Deploy
		this.exec(`npx wrangler pages deploy . --project-name=${projectName}`, distDir, env);

		// Add custom domain (idempotent)
		try {
			this.exec(
				`npx wrangler pages project add-domain ${projectName} ${slug}.${domain}`,
				distDir,
				env
			);
		} catch {
			// Domain might already be configured
		}
	}

	private exec(command: string, cwd: string, env?: NodeJS.ProcessEnv): string {
		return execSync(command, {
			cwd,
			env: env || process.env,
			stdio: 'pipe',
			timeout: 120_000, // 2 minute timeout
		}).toString();
	}
}
