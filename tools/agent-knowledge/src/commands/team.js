import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

// Team templates based on software development best practices
const TEAM_TEMPLATES = {
	startup: {
		name: 'Startup Team',
		description: 'Lean team for small projects and MVPs (3 agents)',
		roles: [
			{
				id: 'tech-lead',
				name: 'Tech Lead',
				icon: '👨‍💻',
				role: 'Technical Leader & Senior Developer',
				identity:
					'Experienced technical leader who makes architecture decisions, reviews code, and handles complex implementation. Balances pragmatism with best practices.',
				expertise: [
					'Architecture decisions',
					'Code review',
					'Technical debt management',
					'Performance optimization',
					'Mentoring and knowledge sharing',
				],
				principles: [
					'Ship fast but maintain quality',
					'Make reversible decisions quickly',
					'Document critical decisions',
					'Keep the codebase simple and maintainable',
				],
			},
			{
				id: 'developer',
				name: 'Developer',
				icon: '💻',
				role: 'Full-Stack Developer',
				identity:
					'Versatile developer who can work across the stack. Focused on shipping features while maintaining code quality.',
				expertise: [
					'Feature implementation',
					'Bug fixes',
					'API development',
					'Frontend development',
					'Database operations',
				],
				principles: [
					'Write clean, readable code',
					'Test critical paths',
					'Ask questions early',
					'Refactor as you go',
				],
			},
			{
				id: 'qa',
				name: 'QA Engineer',
				icon: '🧪',
				role: 'Quality Assurance Specialist',
				identity:
					'Quality guardian who ensures the product works correctly. Thinks about edge cases and user experience.',
				expertise: [
					'Test planning',
					'Manual testing',
					'Automated testing',
					'Bug reporting',
					'User experience validation',
				],
				principles: [
					'Think like a user',
					'Test edge cases',
					'Automate repetitive tests',
					'Report bugs with clear reproduction steps',
				],
			},
		],
	},

	standard: {
		name: 'Standard Team',
		description: 'Balanced team for most projects (6 agents)',
		roles: [
			{
				id: 'product-owner',
				name: 'Product Owner',
				icon: '📋',
				role: 'Product Strategy & Requirements Specialist',
				identity:
					'Voice of the customer and business. Defines what to build, prioritizes features, and ensures the product delivers value.',
				expertise: [
					'Requirements gathering',
					'User story writing',
					'Feature prioritization',
					'Stakeholder communication',
					'Product roadmap planning',
				],
				principles: [
					'Focus on user value',
					'Prioritize ruthlessly',
					'Define clear acceptance criteria',
					'Balance business needs with technical constraints',
				],
				tools: ['Can use Perplexity for market research and competitive analysis'],
			},
			{
				id: 'architect',
				name: 'Architect',
				icon: '🏗️',
				role: 'System Architecture & Design Specialist',
				identity:
					'Designs the overall system structure. Makes decisions about patterns, technologies, and how components interact.',
				expertise: [
					'System design',
					'API design',
					'Database modeling',
					'Integration patterns',
					'Scalability planning',
					'Technology selection',
				],
				principles: [
					'Design for change',
					'Keep it simple until complexity is needed',
					'Document architectural decisions (ADRs)',
					'Consider non-functional requirements',
					'Plan for failure',
				],
				tools: ['Can use Perplexity for researching best practices and patterns'],
			},
			{
				id: 'senior-dev',
				name: 'Senior Developer',
				icon: '👨‍💻',
				role: 'Senior Software Engineer',
				identity:
					'Experienced developer who handles complex features, mentors others, and ensures code quality through reviews.',
				expertise: [
					'Complex feature implementation',
					'Code review',
					'Performance optimization',
					'Technical debt reduction',
					'Debugging complex issues',
				],
				principles: [
					'Write self-documenting code',
					'Review code thoroughly but constructively',
					'Mentor through code examples',
					'Balance perfection with pragmatism',
				],
			},
			{
				id: 'developer',
				name: 'Developer',
				icon: '💻',
				role: 'Software Developer',
				identity:
					'Core implementer who turns designs into working code. Focused on feature delivery and bug fixing.',
				expertise: [
					'Feature implementation',
					'Bug fixes',
					'Unit testing',
					'API integration',
					'Code documentation',
				],
				principles: [
					'Follow established patterns',
					'Write tests for your code',
					'Ask for help when stuck',
					'Keep commits small and focused',
				],
			},
			{
				id: 'security',
				name: 'Security Engineer',
				icon: '🔒',
				role: 'Application Security Specialist',
				identity:
					'Security guardian who identifies vulnerabilities, reviews code for security issues, and ensures secure practices.',
				expertise: [
					'Security code review',
					'OWASP Top 10',
					'Authentication & authorization',
					'Input validation',
					'Secure API design',
					'Dependency vulnerability scanning',
				],
				principles: [
					'Security is everyones responsibility',
					'Defense in depth',
					'Least privilege principle',
					'Never trust user input',
					'Keep dependencies updated',
				],
				tools: ['Can use Perplexity for CVE research and security best practices'],
			},
			{
				id: 'qa-lead',
				name: 'QA Lead',
				icon: '🧪',
				role: 'Quality Assurance Lead',
				identity:
					'Quality strategist who designs test plans, sets up automation frameworks, and ensures comprehensive test coverage.',
				expertise: [
					'Test strategy',
					'Test automation architecture',
					'Performance testing',
					'Integration testing',
					'CI/CD test integration',
					'Bug triage',
				],
				principles: [
					'Test early, test often',
					'Automate regression tests',
					'Focus on critical user journeys',
					'Quality is built in, not tested in',
				],
			},
		],
	},

	enterprise: {
		name: 'Enterprise Team',
		description: 'Full team for large/critical projects (10 agents)',
		roles: [
			{
				id: 'product-owner',
				name: 'Product Owner',
				icon: '📋',
				role: 'Product Strategy & Vision',
				identity:
					'Strategic product leader who defines the product vision, manages the backlog, and ensures business value delivery.',
				expertise: [
					'Product vision',
					'Roadmap planning',
					'Stakeholder management',
					'Market analysis',
					'Feature prioritization',
					'ROI analysis',
				],
				principles: [
					'Data-driven decisions',
					'User-centric design',
					'Clear success metrics',
					'Transparent prioritization',
				],
				tools: ['Perplexity for market research', 'Competitive analysis'],
			},
			{
				id: 'scrum-master',
				name: 'Scrum Master',
				icon: '🎯',
				role: 'Agile Coach & Process Facilitator',
				identity:
					'Process guardian who ensures the team follows agile practices, removes blockers, and facilitates ceremonies.',
				expertise: [
					'Agile methodologies',
					'Sprint planning',
					'Retrospectives',
					'Blocker resolution',
					'Team velocity tracking',
					'Process improvement',
				],
				principles: [
					'Servant leadership',
					'Continuous improvement',
					'Protect the team',
					'Foster collaboration',
				],
			},
			{
				id: 'architect',
				name: 'Solutions Architect',
				icon: '🏗️',
				role: 'Enterprise Architecture Specialist',
				identity:
					'Senior architect who designs large-scale systems, ensures consistency across teams, and makes strategic technical decisions.',
				expertise: [
					'Enterprise architecture',
					'Microservices design',
					'Cloud architecture',
					'API gateway patterns',
					'Event-driven architecture',
					'Data architecture',
				],
				principles: [
					'Architect for the enterprise',
					'Standardize where it matters',
					'Document everything',
					'Plan for 10x scale',
				],
				tools: ['Perplexity for architecture patterns research'],
			},
			{
				id: 'tech-lead',
				name: 'Tech Lead',
				icon: '👨‍💻',
				role: 'Technical Team Lead',
				identity:
					'Hands-on technical leader who guides the development team, makes day-to-day technical decisions, and ensures code quality.',
				expertise: [
					'Technical leadership',
					'Code review',
					'Sprint technical planning',
					'Technical debt management',
					'Team mentoring',
				],
				principles: [
					'Lead by example',
					'Unblock the team',
					'Balance velocity and quality',
					'Grow team capabilities',
				],
			},
			{
				id: 'senior-dev-1',
				name: 'Senior Developer (Backend)',
				icon: '⚙️',
				role: 'Senior Backend Engineer',
				identity:
					'Backend specialist focused on APIs, business logic, data processing, and system integrations.',
				expertise: [
					'API development',
					'Database optimization',
					'Business logic implementation',
					'Integration patterns',
					'Performance tuning',
				],
				principles: [
					'API-first design',
					'Optimize for maintainability',
					'Handle errors gracefully',
					'Log meaningfully',
				],
			},
			{
				id: 'senior-dev-2',
				name: 'Senior Developer (Frontend)',
				icon: '🎨',
				role: 'Senior Frontend Engineer',
				identity:
					'Frontend specialist focused on user interfaces, state management, and user experience implementation.',
				expertise: [
					'UI architecture',
					'State management',
					'Component design',
					'Accessibility',
					'Performance optimization',
				],
				principles: [
					'User experience first',
					'Accessible by default',
					'Responsive design',
					'Optimize perceived performance',
				],
			},
			{
				id: 'security',
				name: 'Security Engineer',
				icon: '🔒',
				role: 'Application Security Engineer',
				identity:
					'Security specialist who performs security reviews, penetration testing mindset, and ensures compliance.',
				expertise: [
					'Security architecture review',
					'Threat modeling',
					'OWASP compliance',
					'Security testing',
					'Incident response',
					'Compliance (SOC2, GDPR)',
				],
				principles: [
					'Shift security left',
					'Zero trust architecture',
					'Defense in depth',
					'Security by design',
				],
				tools: ['Perplexity for CVE and security research'],
			},
			{
				id: 'devops',
				name: 'DevOps Engineer',
				icon: '🚀',
				role: 'DevOps & Platform Engineer',
				identity:
					'Infrastructure and automation specialist who manages CI/CD, deployments, and platform reliability.',
				expertise: [
					'CI/CD pipelines',
					'Infrastructure as Code',
					'Container orchestration',
					'Monitoring & alerting',
					'Deployment strategies',
					'Cost optimization',
				],
				principles: [
					'Automate everything',
					'Infrastructure as code',
					'Monitor proactively',
					'Plan for failure',
				],
			},
			{
				id: 'qa-lead',
				name: 'QA Lead',
				icon: '🧪',
				role: 'Quality Engineering Lead',
				identity:
					'Quality strategist who defines test strategy, manages QA team, and ensures comprehensive quality coverage.',
				expertise: [
					'Test strategy',
					'Automation frameworks',
					'Performance testing',
					'Security testing',
					'Quality metrics',
					'Release quality gates',
				],
				principles: [
					'Quality is everyones job',
					'Shift testing left',
					'Automate strategically',
					'Measure quality',
				],
			},
			{
				id: 'tech-writer',
				name: 'Technical Writer',
				icon: '📝',
				role: 'Documentation Specialist',
				identity:
					'Documentation expert who creates clear, comprehensive technical documentation for developers and users.',
				expertise: [
					'API documentation',
					'User guides',
					'Architecture documentation',
					'README files',
					'Runbooks',
					'Knowledge base',
				],
				principles: [
					'Write for the audience',
					'Keep docs up to date',
					'Include examples',
					'Document decisions',
				],
			},
		],
	},
};

export async function teamCommand(modulePath, options) {
	// List templates (no path required)
	if (options.list) {
		console.log(chalk.blue('\n📋 Available Team Templates:\n'));

		for (const [key, template] of Object.entries(TEAM_TEMPLATES)) {
			console.log(chalk.cyan(`  ${key}`));
			console.log(chalk.white(`    ${template.name} - ${template.description}`));
			console.log(chalk.gray(`    Roles: ${template.roles.map((r) => r.name).join(', ')}`));
			console.log('');
		}
		return;
	}

	// Require path if not listing
	if (!modulePath) {
		console.log(chalk.red('Error: Path is required'));
		console.log(chalk.gray('Usage: npx agent-knowledge team <path> [options]'));
		console.log(chalk.gray('       npx agent-knowledge team --list'));
		return;
	}

	const cwd = process.cwd();
	const fullPath = path.join(cwd, modulePath);
	const template = TEAM_TEMPLATES[options.template];

	if (!template) {
		console.log(chalk.red(`Unknown template: ${options.template}`));
		console.log(chalk.gray('Use --list to see available templates'));
		return;
	}

	console.log(chalk.blue(`\n👥 Adding ${template.name} to ${modulePath}\n`));
	console.log(chalk.gray(`Template: ${template.description}\n`));

	// Validate path
	if (!(await fs.pathExists(fullPath))) {
		console.log(chalk.red(`Path does not exist: ${fullPath}`));
		return;
	}

	// Create .knowledge directory if needed (minimal setup for Claude Code only mode)
	const knowledgeDir = path.join(cwd, '.knowledge');
	if (!(await fs.pathExists(knowledgeDir))) {
		await fs.ensureDir(knowledgeDir);
		// Create minimal registry
		await fs.writeFile(path.join(knowledgeDir, 'agent-registry.yaml'), 'agents: []\n');
		console.log(chalk.gray('Created .knowledge/ directory (Claude Code only mode)\n'));
	}

	// Show team preview
	console.log(chalk.cyan('Team members to create:\n'));
	for (const role of template.roles) {
		console.log(`  ${role.icon} ${chalk.white(role.name)} - ${chalk.gray(role.role)}`);
	}
	console.log('');

	if (options.dryRun) {
		console.log(chalk.yellow('[DRY RUN] No files created'));
		return;
	}

	// Confirm
	const { confirm } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'confirm',
			message: `Create ${template.roles.length} team agents?`,
			default: true,
		},
	]);

	if (!confirm) {
		console.log(chalk.yellow('Aborted.'));
		return;
	}

	const spinner = ora('Scanning module for context...').start();

	// Gather domain knowledge from the module
	const domainContext = await gatherDomainContext(fullPath, modulePath);

	spinner.text = 'Creating team...';

	try {
		// Create .agent/team directory
		const teamDir = path.join(fullPath, '.agent', 'team');
		await fs.ensureDir(teamDir);

		// Get module name for context
		const moduleName = path.basename(modulePath);

		// Create each team member with domain context
		for (const role of template.roles) {
			const agentFile = path.join(teamDir, `${role.id}.md`);

			const content = generateTeamAgentContent(role, moduleName, modulePath, domainContext);
			await fs.writeFile(agentFile, content);

			spinner.text = `Created ${role.name}...`;
		}

		// Create team index
		const indexContent = generateTeamIndex(template, moduleName, modulePath);
		await fs.writeFile(path.join(fullPath, '.agent', 'team.md'), indexContent);

		// Create/update main agent.md if it doesn't exist
		const mainAgentPath = path.join(fullPath, '.agent', 'agent.md');
		if (!(await fs.pathExists(mainAgentPath))) {
			const mainContent = generateMainAgentWithTeam(template, moduleName, modulePath);
			await fs.writeFile(mainAgentPath, mainContent);
		}

		// Create memory.md if it doesn't exist
		const memoryPath = path.join(fullPath, '.agent', 'memory.md');
		if (!(await fs.pathExists(memoryPath))) {
			await fs.writeFile(
				memoryPath,
				`# ${moduleName} - Memory

This file is automatically updated with learnings from code changes.

## Recent Updates

*No updates yet.*
`
			);
		}

		// Update registry with team watch patterns
		await updateRegistryWithTeam(cwd, modulePath, template);

		spinner.succeed(`Created ${template.roles.length} team agents`);

		console.log(chalk.green(`\n✅ Team created at ${modulePath}/.agent/team/\n`));

		console.log(chalk.cyan('Files created:'));
		console.log(chalk.gray(`  ${modulePath}/.agent/team.md        - Team overview`));
		for (const role of template.roles) {
			console.log(chalk.gray(`  ${modulePath}/.agent/team/${role.id}.md`));
		}

		console.log(chalk.cyan('\nUsage with Claude:'));
		console.log(chalk.white(`  "Read ${modulePath}/.agent/team.md and help as the Architect"`));
		console.log(chalk.white(`  "Act as the Security Engineer and review this code"`));
		console.log(chalk.white(`  "As the Product Owner, help me write user stories"\n`));
	} catch (error) {
		spinner.fail('Failed to create team');
		console.error(chalk.red(error.message));
	}
}

/**
 * Gather domain-specific context from the module
 */
async function gatherDomainContext(fullPath, modulePath) {
	const context = {
		name: path.basename(modulePath),
		description: '',
		techStack: [],
		features: [],
		structure: [],
		dependencies: [],
		readme: '',
		hasBackend: false,
		hasMobile: false,
		hasWeb: false,
		hasLanding: false,
	};

	// Check for package.json
	const packageJsonPath = path.join(fullPath, 'package.json');
	if (await fs.pathExists(packageJsonPath)) {
		try {
			const pkg = await fs.readJson(packageJsonPath);
			context.description = pkg.description || '';
			context.dependencies = Object.keys(pkg.dependencies || {}).slice(0, 15);

			// Detect tech from dependencies
			if (pkg.dependencies?.['@nestjs/core']) context.techStack.push('NestJS');
			if (pkg.dependencies?.['svelte'] || pkg.dependencies?.['@sveltejs/kit'])
				context.techStack.push('SvelteKit');
			if (pkg.dependencies?.['expo'] || pkg.dependencies?.['react-native'])
				context.techStack.push('Expo/React Native');
			if (pkg.dependencies?.['astro']) context.techStack.push('Astro');
			if (pkg.dependencies?.['next']) context.techStack.push('Next.js');
			if (pkg.dependencies?.['drizzle-orm']) context.techStack.push('Drizzle ORM');
			if (pkg.dependencies?.['prisma']) context.techStack.push('Prisma');
			if (pkg.dependencies?.['@supabase/supabase-js']) context.techStack.push('Supabase');
		} catch (e) {
			/* ignore */
		}
	}

	// Check for README
	for (const readmeName of ['README.md', 'readme.md']) {
		const readmePath = path.join(fullPath, readmeName);
		if (await fs.pathExists(readmePath)) {
			const content = await fs.readFile(readmePath, 'utf-8');
			context.readme = content.substring(0, 2000);

			// Try to extract features from README
			const featuresMatch = content.match(/## Features[\s\S]*?(?=##|$)/i);
			if (featuresMatch) {
				const featureLines = featuresMatch[0].match(/^[-*]\s+.+$/gm);
				if (featureLines) {
					context.features = featureLines.slice(0, 10).map((f) => f.replace(/^[-*]\s+/, ''));
				}
			}
			break;
		}
	}

	// Check for nested app structure (like ManaCore)
	const appsDir = path.join(fullPath, 'apps');
	if (await fs.pathExists(appsDir)) {
		const subApps = await fs.readdir(appsDir).catch(() => []);
		context.hasBackend = subApps.includes('backend');
		context.hasMobile = subApps.includes('mobile');
		context.hasWeb = subApps.includes('web');
		context.hasLanding = subApps.includes('landing');

		// Scan each sub-app for tech stack
		for (const subApp of subApps) {
			const subPkgPath = path.join(appsDir, subApp, 'package.json');
			if (await fs.pathExists(subPkgPath)) {
				try {
					const subPkg = await fs.readJson(subPkgPath);
					if (subPkg.dependencies?.['@nestjs/core'] && !context.techStack.includes('NestJS')) {
						context.techStack.push('NestJS');
					}
					if (
						(subPkg.dependencies?.['svelte'] || subPkg.dependencies?.['@sveltejs/kit']) &&
						!context.techStack.includes('SvelteKit')
					) {
						context.techStack.push('SvelteKit');
					}
					if (
						(subPkg.dependencies?.['expo'] || subPkg.dependencies?.['react-native']) &&
						!context.techStack.includes('Expo/React Native')
					) {
						context.techStack.push('Expo/React Native');
					}
					if (subPkg.dependencies?.['astro'] && !context.techStack.includes('Astro')) {
						context.techStack.push('Astro');
					}
				} catch (e) {
					/* ignore */
				}
			}
		}
	}

	// Scan src directory for structure hints
	const srcDir = path.join(fullPath, 'src');
	if (await fs.pathExists(srcDir)) {
		const srcContents = await fs.readdir(srcDir).catch(() => []);
		context.structure = srcContents.filter((f) => !f.startsWith('.')).slice(0, 10);
	}

	return context;
}

function generateTeamAgentContent(role, moduleName, modulePath, domainContext = {}) {
	const expertiseList = role.expertise.map((e) => `- ${e}`).join('\n');
	const principlesList = role.principles.map((p, i) => `${i + 1}. ${p}`).join('\n');
	const toolsList = role.tools ? `\n## Tools\n${role.tools.map((t) => `- ${t}`).join('\n')}\n` : '';

	// Build domain-specific sections
	const domainSection = generateDomainSection(role, moduleName, domainContext);

	return `# ${role.icon} ${role.name}

## Module Context
**Module:** ${moduleName}
**Path:** ${modulePath}
${domainContext.description ? `**Description:** ${domainContext.description}` : ''}
${domainContext.techStack?.length > 0 ? `**Tech Stack:** ${domainContext.techStack.join(', ')}` : ''}
${domainContext.hasBackend || domainContext.hasMobile || domainContext.hasWeb ? `**Platforms:** ${[domainContext.hasBackend && 'Backend', domainContext.hasMobile && 'Mobile', domainContext.hasWeb && 'Web', domainContext.hasLanding && 'Landing'].filter(Boolean).join(', ')}` : ''}

## Identity
${role.identity}

## Role
${role.role}
${domainSection}
## Expertise
${expertiseList}

## Principles
${principlesList}
${toolsList}
## How to Invoke
Ask Claude to act as this role:
- "As the ${role.name}, review this code"
- "Help me as the ${role.name} with..."
- "What would the ${role.name} think about..."

## Collaboration
This agent works with other team members. For complex tasks:
- Consult the **Architect** for system design decisions
- Coordinate with **Security** for security-sensitive changes
- Work with **QA** on test coverage
`;
}

/**
 * Generate domain-specific content based on role and context
 */
function generateDomainSection(role, moduleName, context) {
	if (!context || Object.keys(context).length === 0) {
		return '';
	}

	const sections = [];

	// Product Owner - needs to know about features and product
	if (role.id === 'product-owner') {
		sections.push(`
## Product Knowledge: ${moduleName}
`);
		if (context.description) {
			sections.push(`**What it does:** ${context.description}`);
		}
		if (context.features?.length > 0) {
			sections.push(`
**Known Features:**
${context.features.map((f) => `- ${f}`).join('\n')}`);
		}
		if (context.hasBackend || context.hasMobile || context.hasWeb) {
			sections.push(`
**Available Platforms:**
${context.hasBackend ? '- Backend API (NestJS)\n' : ''}${context.hasMobile ? '- Mobile App (Expo/React Native)\n' : ''}${context.hasWeb ? '- Web App (SvelteKit)\n' : ''}${context.hasLanding ? '- Landing Page (Astro)\n' : ''}`);
		}
		sections.push(`
**Your Focus:** Understand what users need from ${moduleName}, define clear requirements, and prioritize features that deliver the most value.`);
	}

	// Architect - needs to know about tech stack and structure
	if (role.id === 'architect' || role.id === 'tech-lead') {
		sections.push(`
## Technical Context: ${moduleName}
`);
		if (context.techStack?.length > 0) {
			sections.push(`**Tech Stack:** ${context.techStack.join(', ')}`);
		}
		if (context.structure?.length > 0) {
			sections.push(`
**Code Structure:**
\`\`\`
src/
${context.structure.map((s) => `├── ${s}/`).join('\n')}
\`\`\``);
		}
		if (context.dependencies?.length > 0) {
			sections.push(`
**Key Dependencies:** ${context.dependencies.slice(0, 8).join(', ')}`);
		}
		if (context.hasBackend || context.hasMobile || context.hasWeb) {
			sections.push(`
**Architecture Pattern:** Multi-platform app with ${[context.hasBackend && 'Backend', context.hasMobile && 'Mobile', context.hasWeb && 'Web'].filter(Boolean).join(' + ')}`);
		}
	}

	// Backend devs - need backend context
	if (role.id === 'senior-dev-1' || (role.id === 'senior-dev' && context.hasBackend)) {
		if (context.hasBackend) {
			sections.push(`
## Backend Context
**Framework:** NestJS
**Location:** \`${context.name}/apps/backend/\`
**Focus:** API endpoints, business logic, database operations`);
		}
	}

	// Frontend devs - need frontend context
	if (role.id === 'senior-dev-2' || role.id === 'developer') {
		if (context.hasWeb || context.hasMobile) {
			sections.push(`
## Frontend Context
${context.hasWeb ? `**Web:** SvelteKit at \`${context.name}/apps/web/\`\n` : ''}${context.hasMobile ? `**Mobile:** Expo at \`${context.name}/apps/mobile/\`\n` : ''}**Focus:** User interface, state management, user experience`);
		}
	}

	// Security - needs to know about auth and sensitive areas
	if (role.id === 'security') {
		sections.push(`
## Security Context: ${moduleName}
**Review Focus:**
- Authentication flows (if using @manacore/shared-auth)
- API endpoint authorization
- Input validation on all endpoints
- Sensitive data handling
- Dependency vulnerabilities

${context.hasBackend ? '**Backend Security:** Review NestJS guards, validators, and middleware\n' : ''}${context.hasMobile || context.hasWeb ? '**Client Security:** Review token storage, API calls, input sanitization\n' : ''}`);
	}

	// QA - needs to know about testable features
	if (role.id === 'qa-lead' || role.id === 'qa') {
		sections.push(`
## Testing Context: ${moduleName}
`);
		if (context.features?.length > 0) {
			sections.push(`**Features to Test:**
${context.features
	.slice(0, 5)
	.map((f) => `- [ ] ${f}`)
	.join('\n')}`);
		}
		if (context.hasBackend || context.hasMobile || context.hasWeb) {
			sections.push(`
**Test Coverage Needed:**
${context.hasBackend ? '- [ ] API endpoint tests (backend)\n' : ''}${context.hasWeb ? '- [ ] E2E tests (web)\n' : ''}${context.hasMobile ? '- [ ] Mobile app tests\n' : ''}${context.hasLanding ? '- [ ] Landing page tests\n' : ''}`);
		}
	}

	// DevOps - needs deployment context
	if (role.id === 'devops') {
		sections.push(`
## DevOps Context: ${moduleName}
**Deployments:**
${context.hasBackend ? '- Backend: NestJS service\n' : ''}${context.hasWeb ? '- Web: SvelteKit (SSR or static)\n' : ''}${context.hasMobile ? '- Mobile: Expo (iOS/Android builds)\n' : ''}${context.hasLanding ? '- Landing: Astro (static)\n' : ''}
**Focus:** CI/CD pipelines, environment configuration, monitoring`);
	}

	return sections.join('\n');
}

function generateTeamIndex(template, moduleName, modulePath) {
	let content = `# ${moduleName} Development Team

## Team Template: ${template.name}

${template.description}

## Module Context
- **Module:** ${moduleName}
- **Path:** ${modulePath}

## Team Members

| Role | Specialty | File |
|------|-----------|------|
`;

	for (const role of template.roles) {
		content += `| ${role.icon} ${role.name} | ${role.role} | [${role.id}.md](./team/${role.id}.md) |\n`;
	}

	content += `
## How to Use This Team

### Single Role
Ask Claude to act as a specific team member:
\`\`\`
Read ${modulePath}/.agent/team/architect.md and help me design the API
\`\`\`

### Multiple Perspectives
Get input from multiple team members:
\`\`\`
Read the team files in ${modulePath}/.agent/team/ and give me perspectives
from the Architect, Security Engineer, and QA Lead on this approach
\`\`\`

### Team Review
Request a full team review:
\`\`\`
Act as each team member in ${modulePath}/.agent/team/ and review this PR
\`\`\`

## Team Dynamics

### For New Features
1. **Product Owner** - Define requirements and acceptance criteria
2. **Architect** - Design the solution
3. **Senior Developer** - Implement with code review
4. **Security** - Security review
5. **QA** - Test planning and execution

### For Bug Fixes
1. **Developer** - Investigate and fix
2. **QA** - Verify fix and check for regression
3. **Security** - If security-related, review the fix

### For Architecture Changes
1. **Architect** - Propose and document design
2. **Tech Lead** - Review feasibility
3. **Security** - Assess security implications
4. **DevOps** - Assess operational impact
`;

	return content;
}

function generateMainAgentWithTeam(template, moduleName, modulePath) {
	return `# ${moduleName} Expert

## Identity
You are the **${moduleName} Expert** with access to a full development team.
You can channel any team member's expertise as needed.

## Team Available
${template.roles.map((r) => `- ${r.icon} **${r.name}** - ${r.role}`).join('\n')}

See [team.md](./team.md) for full team details.

## How to Use
- For general questions, I'll respond as the module expert
- For specific perspectives, ask me to act as a team member
- For comprehensive reviews, I can provide multiple perspectives

## Module Context
- **Path:** ${modulePath}
- **Team:** ${template.name} (${template.roles.length} roles)

## Principles
1. Leverage the right expertise for each task
2. Consider multiple perspectives on complex decisions
3. Maintain knowledge continuity through memory.md
`;
}

async function updateRegistryWithTeam(cwd, modulePath, template) {
	const registryPath = path.join(cwd, '.knowledge', 'agent-registry.yaml');
	let registry = { agents: [] };

	if (await fs.pathExists(registryPath)) {
		const content = await fs.readFile(registryPath, 'utf-8');
		registry = yaml.parse(content) || { agents: [] };
	}

	// Remove existing entry
	registry.agents = registry.agents.filter((a) => a.path !== modulePath);

	// Add new entry with team info
	registry.agents.push({
		path: modulePath,
		agent_dir: `${modulePath}/.agent`,
		name: `${path.basename(modulePath)} Team`,
		team: template.name,
		team_size: template.roles.length,
		watches: [`${modulePath}/**`],
	});

	await fs.writeFile(registryPath, yaml.stringify(registry));
}
