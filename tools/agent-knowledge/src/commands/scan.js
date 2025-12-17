import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { spawn } from 'child_process';

/**
 * Generate role definitions for team templates
 */
function generateRoleDefinitions(template) {
	const roles = {
		startup: [
			{
				id: 'tech-lead',
				name: 'Tech Lead',
				emoji: '👨‍💻',
				desc: 'Technical leader who makes architecture decisions, reviews code, mentors the team, and handles complex implementation challenges.',
			},
			{
				id: 'developer',
				name: 'Developer',
				emoji: '💻',
				desc: 'Full-stack developer who implements features, fixes bugs, writes tests, and follows established patterns.',
			},
			{
				id: 'qa',
				name: 'QA Engineer',
				emoji: '🧪',
				desc: 'Quality guardian who plans tests, finds edge cases, reports bugs clearly, and validates user experience.',
			},
		],
		standard: [
			{
				id: 'product-owner',
				name: 'Product Owner',
				emoji: '📋',
				desc: 'Voice of the customer. Defines requirements, prioritizes features, writes user stories, and ensures product delivers value.',
			},
			{
				id: 'architect',
				name: 'Architect',
				emoji: '🏗️',
				desc: 'Designs system structure, makes technology decisions, defines patterns, and ensures scalability and maintainability.',
			},
			{
				id: 'senior-dev',
				name: 'Senior Developer',
				emoji: '👨‍💻',
				desc: 'Experienced developer who tackles complex features, reviews code, mentors juniors, and establishes best practices.',
			},
			{
				id: 'developer',
				name: 'Developer',
				emoji: '💻',
				desc: 'Implements features, fixes bugs, writes tests, and follows the patterns established by seniors.',
			},
			{
				id: 'security',
				name: 'Security Engineer',
				emoji: '🔒',
				desc: 'Security expert who reviews code for vulnerabilities, ensures auth is solid, and protects user data.',
			},
			{
				id: 'qa-lead',
				name: 'QA Lead',
				emoji: '🧪',
				desc: 'Leads testing strategy, plans test coverage, coordinates QA efforts, and ensures quality gates are met.',
			},
		],
		enterprise: [
			{
				id: 'product-owner',
				name: 'Product Owner',
				emoji: '📋',
				desc: 'Voice of the customer. Defines requirements, prioritizes features, writes user stories, and ensures product delivers value.',
			},
			{
				id: 'scrum-master',
				name: 'Scrum Master',
				emoji: '🎯',
				desc: 'Facilitates agile processes, removes blockers, runs ceremonies, and ensures team velocity.',
			},
			{
				id: 'architect',
				name: 'Solutions Architect',
				emoji: '🏗️',
				desc: 'Designs end-to-end solutions, makes technology decisions, defines integration patterns, ensures enterprise compliance.',
			},
			{
				id: 'tech-lead',
				name: 'Tech Lead',
				emoji: '👨‍💻',
				desc: 'Technical leader for the team. Owns technical decisions, code quality, and mentorship.',
			},
			{
				id: 'backend-dev',
				name: 'Backend Developer',
				emoji: '⚙️',
				desc: 'Specializes in backend/API development, database design, and server-side logic.',
			},
			{
				id: 'frontend-dev',
				name: 'Frontend Developer',
				emoji: '🎨',
				desc: 'Specializes in UI/UX implementation, component development, and frontend performance.',
			},
			{
				id: 'security',
				name: 'Security Engineer',
				emoji: '🔒',
				desc: 'Security expert who performs threat modeling, security reviews, and ensures compliance.',
			},
			{
				id: 'devops',
				name: 'DevOps Engineer',
				emoji: '🚀',
				desc: 'Manages CI/CD, infrastructure, deployments, monitoring, and operational excellence.',
			},
			{
				id: 'qa-lead',
				name: 'QA Lead',
				emoji: '🧪',
				desc: 'Leads testing strategy, automation, and quality assurance across all platforms.',
			},
			{
				id: 'tech-writer',
				name: 'Technical Writer',
				emoji: '📝',
				desc: 'Creates documentation, API docs, user guides, and ensures knowledge is captured.',
			},
		],
	};

	const templateRoles = roles[template] || roles.standard;

	return templateRoles
		.map((r) => `### ${r.emoji} ${r.name} (\`${r.id}.md\`)\n${r.desc}`)
		.join('\n\n');
}

/**
 * Generate prompt for Claude Code to create rich agent descriptions
 */
async function generateClaudeInitPrompt(cwd, options) {
	console.log(chalk.blue('\n🤖 Generating Claude Code initialization prompt...\n'));

	const spinner = ora('Scanning project structure...').start();

	// Discover all modules
	const structure = await discoverStructure(cwd, options.depth || 4);

	// Filter to top-level modules
	const topLevelOnly = structure.modules.filter((m) => {
		const parts = m.path.split('/');
		if (parts.length === 2 && ['apps', 'packages', 'services', 'games'].includes(parts[0])) {
			return true;
		}
		if (parts.length === 4 && parts[0] === 'apps' && parts[2] === 'packages') {
			return true;
		}
		return false;
	});

	const apps = topLevelOnly.filter((m) => {
		if (m.path.includes('/packages/')) return false;
		return m.type === 'app' || m.type === 'service' || m.path.startsWith('games/');
	});
	const packages = topLevelOnly.filter(
		(m) =>
			m.type === 'package' ||
			m.type === 'library' ||
			m.type === 'shared' ||
			m.path.includes('/packages/')
	);

	spinner.succeed(`Found ${apps.length} apps and ${packages.length} packages\n`);

	// Create .knowledge directory
	const knowledgeDir = path.join(cwd, '.knowledge');
	await fs.ensureDir(knowledgeDir);

	const template = options.template || 'startup';

	// Generate the prompt
	const promptContent = `# Initialize Agent Knowledge System

You are helping set up an AI agent knowledge system for this codebase. Your task is to analyze each module and create rich, domain-specific agent files.

## What You Need To Do

For each module listed below, you need to:
1. **Read the module's code** - Look at package.json, README, src/ structure, key files
2. **Understand its purpose** - What does it do? How is it used?
3. **Create agent files** - Write .agent/agent.md (and team files for apps)

## Modules to Process

### Apps (${apps.length}) - Create ${template} team for each
${apps.map((a) => `- \`${a.path}\``).join('\n')}

### Packages (${packages.length}) - Create single agent for each
${packages.map((p) => `- \`${p.path}\``).join('\n')}

## Team Template: ${template}
Roles to create for each app:

${generateRoleDefinitions(template)}

## Agent File Format

### For Packages (single agent)
Create \`{path}/.agent/agent.md\`:

\`\`\`markdown
# {Module Name} Expert

## Module: {name}
**Path:** \`{path}\`
**Description:** {Your analysis of what this module does}
**Tech Stack:** {Detected technologies}
**Key Dependencies:** {Important deps}

## Identity
You are the **{Module Name} Expert**. You have deep knowledge of:
- {Key thing 1 this module handles}
- {Key thing 2}
- {Integration patterns with other modules}

## Expertise
- {Domain expertise 1}
- {Domain expertise 2}
- {Domain expertise 3}

## Code Structure
\\\`\\\`\\\`
{path}/src/
├── {folder1}/  # {what it contains}
├── {folder2}/  # {what it contains}
\\\`\\\`\\\`

## Key Patterns
- {Important pattern 1 used in this module}
- {Important pattern 2}

## Integration Points
- Used by: {list apps/packages that depend on this}
- Depends on: {list dependencies}

## How to Use
\\\`\\\`\\\`
"Read {path}/.agent/ and help me with..."
\\\`\\\`\\\`
\`\`\`

Also create \`{path}/.agent/memory.md\`:
\`\`\`markdown
# {Module Name} Expert - Memory

Auto-updated with learnings from code changes.

## Recent Updates
*No updates yet.*
\`\`\`

### For Apps (team)
Create \`{path}/.agent/team/{role-id}.md\` for each role:

\`\`\`markdown
# {Role Name}

## Module: {app name}
**Path:** \`{path}\`
**Description:** {Your analysis}
**Tech Stack:** {Technologies}
**Platforms:** {Backend, Mobile, Web, etc.}

## Identity
{Role-specific identity based on what this app does}

## Responsibilities
- {Responsibility 1 specific to this app}
- {Responsibility 2}

## Domain Knowledge
{What this role needs to know about this specific app}

## Key Areas
- {Area 1 this role focuses on}
- {Area 2}

## How to Invoke
\\\`\\\`\\\`
"As the {Role} for {app}, help me with..."
\\\`\\\`\\\`
\`\`\`

Also create \`{path}/.agent/team.md\` with team overview.

## Instructions

1. Start with the most important modules first (shared-auth, shared-api-client, core apps)
2. For each module:
   - Read its package.json, README.md, and browse src/
   - Understand what it does and how it's used
   - Write the agent files with YOUR analysis (not just copying README)
3. Make the descriptions actionable - what would a developer need to know?
4. Include integration points - how does this module connect to others?

## Start Now

Begin by analyzing the first few high-priority modules:
1. \`packages/shared-auth\` - Authentication (critical)
2. \`packages/shared-api-client\` - API client (used everywhere)
3. \`apps/chat\` - Main chat application

For each one:
1. Read the code
2. Write the agent files
3. Move to the next

Say "I'll start analyzing the modules now" and begin with shared-auth.
`;

	const promptPath = path.join(knowledgeDir, 'claude-init-agents.md');
	await fs.writeFile(promptPath, promptContent);

	console.log(chalk.green('✅ Claude initialization prompt generated!\n'));

	console.log(chalk.cyan('📋 Summary:'));
	console.log(chalk.gray(`   Apps to process: ${apps.length} (${template} teams)`));
	console.log(chalk.gray(`   Packages to process: ${packages.length} (single agents)`));
	console.log(chalk.gray(`   Prompt saved to: .knowledge/claude-init-agents.md\n`));

	// Ask if user wants to auto-run with Claude Code
	const { autoRun } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'autoRun',
			message: 'Run Claude Code now to create rich agent files?',
			default: true,
		},
	]);

	if (autoRun) {
		await runClaudeCode(cwd);
	} else {
		console.log(chalk.cyan('\n🚀 To run later, use this command:\n'));
		console.log(
			chalk.yellow(`  claude -p "Read .knowledge/claude-init-agents.md and create the agent files"`)
		);
		console.log('');
	}
}

/**
 * Run Claude Code to create agent files
 */
async function runClaudeCode(cwd) {
	console.log(chalk.blue('\n🤖 Starting Claude Code...\n'));

	const prompt =
		'Read .knowledge/claude-init-agents.md and create the agent files for all modules listed.';

	console.log(chalk.gray('─'.repeat(60)));
	console.log(chalk.white('Starting Claude with prompt:\n'));
	console.log(chalk.yellow(`  "${prompt}"\n`));
	console.log(chalk.gray('─'.repeat(60)));
	console.log('');

	return new Promise((resolve) => {
		// Spawn claude with the prompt and skip permission prompts
		const claude = spawn('claude', ['--dangerously-skip-permissions', prompt], {
			cwd,
			stdio: 'inherit',
		});

		claude.on('error', (err) => {
			console.log(chalk.red('\n❌ Failed to start Claude Code.\n'));
			console.log(chalk.yellow('Make sure Claude Code is installed.'));
			console.log(chalk.gray('\nRun manually:'));
			console.log(chalk.white(`  cd ${cwd}`));
			console.log(chalk.white(`  claude "${prompt}"`));
			resolve();
		});

		claude.on('close', (code) => {
			if (code === 0) {
				console.log(chalk.green('\n✅ Done! Agent files created.'));
			}
			resolve();
		});
	});
}

// Claude Code prompt generation - works standalone without init
async function generateClaudePrompt(cwd, options = {}) {
	console.log(chalk.blue('\n🤖 Claude Code Only Mode\n'));
	console.log(chalk.gray('No API keys needed - uses Claude Code for everything.\n'));

	const spinner = ora('Setting up...').start();

	// Ensure .knowledge directory exists (minimal setup)
	const knowledgeDir = path.join(cwd, '.knowledge');
	await fs.ensureDir(knowledgeDir);

	const promptContent = `# Agent Knowledge System - Project Analysis Request

## Your Task

Analyze this codebase and help set up the Agent Knowledge System with appropriate agents for each module/package.

## What to Analyze

1. **Project Structure**: Scan the directory structure to understand the monorepo layout
2. **Package Types**: Identify apps, packages, services, libraries, and their purposes
3. **Dependencies**: Look at package.json files to understand relationships
4. **Tech Stack**: Identify frameworks (NestJS, SvelteKit, Expo, Astro, etc.)
5. **Shared Code**: Find shared packages that are used across multiple apps

## Analysis Steps

### Step 1: Discover Structure
Run these commands to understand the project:
\`\`\`bash
# List top-level directories
ls -la

# Find all package.json files
find . -name "package.json" -not -path "*/node_modules/*" | head -50

# Find common config files to identify tech stack
find . -name "nest-cli.json" -o -name "svelte.config.js" -o -name "app.json" -o -name "astro.config.mjs" 2>/dev/null | head -20
\`\`\`

### Step 2: Identify High-Value Modules
Look for modules that would benefit most from dedicated agents:
- **Auth modules** - Critical, used everywhere
- **Core/shared packages** - Foundation code
- **API clients** - Integration points
- **UI components** - Design system
- **Database packages** - Data layer

### Step 3: Recommend Agent Setup
For each important module, suggest:
1. Whether it needs a **single agent** or a **team**
2. What **watch patterns** should track changes to this module
3. What **related modules** the agent should also know about

## Output Format

Please provide your analysis in this format:

### Project Overview
- Type: [monorepo/single-app/etc]
- Primary tech stack: [list technologies]
- Total packages/apps: [count]

### Recommended Agents

#### High Priority (Create First)
| Path | Agent Type | Reason |
|------|------------|--------|
| packages/shared-auth | Single Agent | Auth is critical, used by all apps |
| ... | ... | ... |

#### Medium Priority
| Path | Agent Type | Reason |
|------|------------|--------|
| ... | ... | ... |

### Recommended Teams
For complex apps that need full team coverage:
| Path | Template | Reason |
|------|----------|--------|
| apps/main-app | standard | Complex app with many features |
| ... | ... | ... |

### Watch Pattern Suggestions
\`\`\`yaml
# Example for auth module
packages/shared-auth:
  watches:
    - packages/shared-auth/**
    - packages/shared-auth-*/**      # Related auth packages
    - apps/*/src/**/auth/**          # Auth code in apps
    - services/auth-service/**       # Auth service
\`\`\`

## After Analysis

Once you provide the analysis, run these commands to set up agents (no API keys needed):

\`\`\`bash
# Add single agent to a module
npx agent-knowledge add-agent <path>

# Add full team to an app
npx agent-knowledge team <path> --template standard

# Preview what would be created
npx agent-knowledge team <path> --dry-run
\`\`\`

**Note:** These commands create .agent/ folders with markdown files. Claude Code itself will read and use these files - no external LLM needed.

---

**Please start by exploring the project structure and providing your analysis.**
`;

	const promptPath = path.join(knowledgeDir, 'claude-scan-prompt.md');
	await fs.writeFile(promptPath, promptContent);

	spinner.succeed('Ready for Claude Code');

	console.log(chalk.green('\n✅ Claude Code mode ready!\n'));

	console.log(chalk.cyan('How to use:'));
	console.log(chalk.white('  Just copy the prompt below and paste it into Claude Code.\n'));

	console.log(chalk.gray(`(Prompt also saved to: ${promptPath})\n`));

	// Also create a shorter version for direct paste
	const quickPrompt = `Analyze this codebase for the Agent Knowledge System:

1. Scan the project structure (apps, packages, services)
2. Identify tech stack (NestJS, SvelteKit, Expo, etc.)
3. Find high-value modules that need agents (auth, core, api, ui)
4. Recommend which modules need single agents vs full teams
5. Suggest watch patterns for cross-module dependencies

Output a table of recommended agents with paths, types (single/team), and reasons.

Start by running: find . -name "package.json" -not -path "*/node_modules/*" | head -30`;

	console.log(chalk.cyan('Quick prompt (copy & paste to Claude Code):'));
	console.log(chalk.gray('─'.repeat(60)));
	console.log(chalk.white(quickPrompt));
	console.log(chalk.gray('─'.repeat(60)));
	console.log('');
}

// Common monorepo patterns to detect
const DETECTION_PATTERNS = [
	// Package directories
	{ pattern: 'packages/*', type: 'package', priority: 'high' },
	{ pattern: 'libs/*', type: 'library', priority: 'high' },
	{ pattern: 'shared/*', type: 'shared', priority: 'high' },

	// App directories
	{ pattern: 'apps/*', type: 'app', priority: 'high' },
	{ pattern: 'projects/*', type: 'project', priority: 'medium' },

	// Services
	{ pattern: 'services/*', type: 'service', priority: 'high' },
	{ pattern: 'backends/*', type: 'backend', priority: 'high' },
	{ pattern: 'api/*', type: 'api', priority: 'medium' },

	// Nested app patterns (like ManaCore)
	{ pattern: 'apps/*/apps/backend', type: 'nested-backend', priority: 'medium' },
	{ pattern: 'apps/*/apps/mobile', type: 'nested-mobile', priority: 'medium' },
	{ pattern: 'apps/*/apps/web', type: 'nested-web', priority: 'medium' },
	{ pattern: 'apps/*/packages/*', type: 'nested-package', priority: 'low' },
];

// Keywords that indicate high-value agents
const HIGH_VALUE_KEYWORDS = [
	'auth',
	'authentication',
	'login',
	'session',
	'api',
	'client',
	'core',
	'common',
	'shared',
	'database',
	'db',
	'storage',
	'cache',
	'ui',
	'components',
	'design',
	'theme',
	'config',
	'utils',
	'helpers',
];

/**
 * Bulk setup all agents automatically
 */
async function setupAllAgents(cwd, options) {
	console.log(chalk.blue('\n🚀 Auto-Setup: Creating agents for all modules\n'));

	const spinner = ora('Scanning project structure...').start();

	// Discover all modules
	const structure = await discoverStructure(cwd, options.depth || 4);
	spinner.succeed(`Found ${structure.total} modules\n`);

	// Filter to only top-level modules (not subdirectories like src/, types/, etc.)
	const topLevelOnly = structure.modules.filter((m) => {
		const parts = m.path.split('/');
		// Only include direct children of apps/, packages/, services/, games/
		if (parts.length === 2 && ['apps', 'packages', 'services', 'games'].includes(parts[0])) {
			return true;
		}
		// Include nested app packages like apps/chat/packages/chat-types
		if (parts.length === 4 && parts[0] === 'apps' && parts[2] === 'packages') {
			return true;
		}
		return false;
	});

	// Separate apps from packages
	const apps = topLevelOnly.filter((m) => {
		// Nested packages inside apps should be packages, not apps
		if (m.path.includes('/packages/')) return false;
		return m.type === 'app' || m.type === 'service' || m.path.startsWith('games/');
	});
	const packages = topLevelOnly.filter(
		(m) =>
			m.type === 'package' ||
			m.type === 'library' ||
			m.type === 'shared' ||
			m.path.includes('/packages/')
	);
	const nested = structure.modules.filter((m) => m.type.startsWith('nested-'));

	console.log(chalk.cyan('📊 Summary:'));
	console.log(chalk.gray(`   Apps/Services: ${apps.length}`));
	console.log(chalk.gray(`   Packages: ${packages.length}`));
	console.log(chalk.gray(`   Nested modules: ${nested.length} (skipped - covered by parent)\n`));

	// Show what will be created
	console.log(chalk.cyan('📋 Will create:\n'));

	if (options.teams) {
		console.log(chalk.yellow(`  Apps (${options.template} team):`));
		for (const app of apps) {
			console.log(chalk.gray(`    👥 ${app.path}`));
		}
	} else {
		console.log(chalk.yellow('  Apps (single agent):'));
		for (const app of apps) {
			console.log(chalk.gray(`    🤖 ${app.path}`));
		}
	}

	console.log(chalk.yellow('\n  Packages (single agent):'));
	for (const pkg of packages) {
		console.log(chalk.gray(`    🤖 ${pkg.path}`));
	}

	console.log('');

	// Dry run - just show what would be created
	if (options.dryRun) {
		console.log(chalk.yellow('[DRY RUN] No agents created.\n'));
		console.log(chalk.gray('Run without --dry-run to create agents.'));
		return;
	}

	// Confirm
	const { confirm } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'confirm',
			message: `Create ${apps.length + packages.length} agents?`,
			default: true,
		},
	]);

	if (!confirm) {
		console.log(chalk.yellow('Aborted.'));
		return;
	}

	// Create .knowledge directory
	const knowledgeDir = path.join(cwd, '.knowledge');
	await fs.ensureDir(knowledgeDir);
	if (!(await fs.pathExists(path.join(knowledgeDir, 'agent-registry.yaml')))) {
		await fs.writeFile(path.join(knowledgeDir, 'agent-registry.yaml'), 'agents: []\n');
	}

	let created = 0;
	let failed = 0;

	// Create agents for apps
	console.log(chalk.blue('\n📱 Setting up apps...\n'));
	for (const app of apps) {
		try {
			if (options.teams) {
				// Import team command and create team
				const { teamCommand } = await import('./team.js');
				await createTeamSilent(cwd, app.path, options.template || 'startup');
				console.log(chalk.green(`  ✓ ${app.path} (${options.template} team)`));
			} else {
				await createSingleAgentSilent(cwd, app);
				console.log(chalk.green(`  ✓ ${app.path}`));
			}
			created++;
		} catch (error) {
			console.log(chalk.red(`  ✗ ${app.path}: ${error.message}`));
			failed++;
		}
	}

	// Create agents for packages
	console.log(chalk.blue('\n📦 Setting up packages...\n'));
	for (const pkg of packages) {
		try {
			await createSingleAgentSilent(cwd, pkg);
			console.log(chalk.green(`  ✓ ${pkg.path}`));
			created++;
		} catch (error) {
			console.log(chalk.red(`  ✗ ${pkg.path}: ${error.message}`));
			failed++;
		}
	}

	// Summary
	console.log(chalk.green(`\n✅ Setup complete!`));
	console.log(chalk.gray(`   Created: ${created}`));
	if (failed > 0) {
		console.log(chalk.red(`   Failed: ${failed}`));
	}

	console.log(chalk.cyan('\n📖 Usage with Claude Code:'));
	console.log(chalk.white('  "Read apps/calendar/.agent/ and help me with..."'));
	console.log(chalk.white('  "Act as the packages/shared-auth expert"\n'));
}

/**
 * Create a team without interactive prompts
 */
async function createTeamSilent(cwd, modulePath, template) {
	const fullPath = path.join(cwd, modulePath);

	// Get domain context
	const context = await gatherDomainContextLocal(fullPath, modulePath);

	// Create team directory
	const teamDir = path.join(fullPath, '.agent', 'team');
	await fs.ensureDir(teamDir);

	// Get template
	const templates = {
		startup: ['tech-lead', 'developer', 'qa'],
		standard: ['product-owner', 'architect', 'senior-dev', 'developer', 'security', 'qa-lead'],
		enterprise: [
			'product-owner',
			'scrum-master',
			'architect',
			'tech-lead',
			'senior-dev-1',
			'senior-dev-2',
			'security',
			'devops',
			'qa-lead',
			'tech-writer',
		],
	};

	const roles = templates[template] || templates.startup;
	const moduleName = path.basename(modulePath);

	// Create rich team files with domain knowledge
	for (const roleId of roles) {
		const agentFile = path.join(teamDir, `${roleId}.md`);
		const roleName = roleId
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');

		// Build platforms string
		const platforms = [
			context.hasBackend && 'Backend (NestJS)',
			context.hasMobile && 'Mobile (Expo)',
			context.hasWeb && 'Web (SvelteKit)',
			context.hasLanding && 'Landing (Astro)',
		].filter(Boolean);

		// Role-specific content
		let roleSection = '';
		if (roleId === 'tech-lead') {
			roleSection = `
## Responsibilities
- Technical decision making and architecture oversight
- Code review and quality standards
- Mentoring developers and unblocking technical issues
- Sprint technical planning

## Focus Areas for ${moduleName}
${context.techStack?.length > 0 ? `- Tech stack expertise: ${context.techStack.join(', ')}` : ''}
${context.structure?.length > 0 ? `- Key modules: ${context.structure.slice(0, 5).join(', ')}` : ''}
${context.dependencies?.length > 0 ? `- Dependencies to know: ${context.dependencies.slice(0, 5).join(', ')}` : ''}`;
		} else if (roleId === 'developer') {
			roleSection = `
## Responsibilities
- Feature implementation and bug fixes
- Writing tests and documentation
- Code review participation
- Following established patterns

## Development Context
${context.techStack?.length > 0 ? `- Stack: ${context.techStack.join(', ')}` : ''}
${platforms.length > 0 ? `- Platforms: ${platforms.join(', ')}` : ''}
${
	context.features?.length > 0
		? `- Features to work on:\n${context.features
				.slice(0, 4)
				.map((f) => `  - ${f}`)
				.join('\n')}`
		: ''
}`;
		} else if (roleId === 'qa') {
			roleSection = `
## Responsibilities
- Test planning and execution
- Bug reporting with clear reproduction steps
- Regression testing
- User experience validation

## Testing Focus for ${moduleName}
${
	context.features?.length > 0
		? `- Features to test:\n${context.features
				.slice(0, 5)
				.map((f) => `  - [ ] ${f}`)
				.join('\n')}`
		: ''
}
${platforms.length > 0 ? `- Platforms to cover: ${platforms.join(', ')}` : ''}
- Edge cases and error handling
- Cross-platform consistency`;
		}

		const content = `# ${roleName}

## Module: ${moduleName}
**Path:** \`${modulePath}\`
${context.description ? `**Description:** ${context.description}` : ''}
${context.techStack?.length > 0 ? `**Tech Stack:** ${context.techStack.join(', ')}` : ''}
${platforms.length > 0 ? `**Platforms:** ${platforms.join(', ')}` : ''}
${roleSection}

## How to Invoke
\`\`\`
"As the ${roleName} for ${moduleName}, help me with..."
"Read ${modulePath}/.agent/team/${roleId}.md and review this code"
\`\`\`
`;
		await fs.writeFile(agentFile, content);
	}

	// Create team index
	const indexContent = `# ${moduleName} Team

## Team: ${template}
${roles
	.map(
		(r) =>
			`- ${r
				.split('-')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ')}`
	)
	.join('\n')}

## Usage
\`\`\`
"Read ${modulePath}/.agent/team/ and help as the Architect"
\`\`\`
`;
	await fs.writeFile(path.join(fullPath, '.agent', 'team.md'), indexContent);

	// Update registry
	await updateRegistry(cwd, {
		path: modulePath,
		agent_dir: `${modulePath}/.agent`,
		name: `${moduleName} Team`,
		team: template,
		watches: [`${modulePath}/**`],
	});
}

/**
 * Create a single agent without interactive prompts
 */
async function createSingleAgentSilent(cwd, mod) {
	const fullPath = path.join(cwd, mod.path);
	const agentDir = path.join(fullPath, '.agent');

	// Skip if agent already exists
	if (await fs.pathExists(agentDir)) {
		return;
	}

	await fs.ensureDir(agentDir);

	const moduleName = path.basename(mod.path);
	const name = generateAgentName(mod);
	const context = await gatherDomainContextLocal(fullPath, mod.path);

	// Create agent.md with rich context
	const agentContent = `# ${name}

## Module: ${moduleName}
**Path:** \`${mod.path}\`
${context.description ? `**Description:** ${context.description}` : ''}
${context.techStack?.length > 0 ? `**Tech Stack:** ${context.techStack.join(', ')}` : ''}
${context.dependencies?.length > 0 ? `**Key Dependencies:** ${context.dependencies.slice(0, 8).join(', ')}` : ''}

## Identity
You are the **${name}** for this codebase. You have deep knowledge of:
- The ${mod.path} module internals and patterns
- How this module integrates with other parts of the codebase
- Best practices and conventions used in this module

## Expertise
${getExpertiseForType(mod.type, mod.path)}
${
	context.structure?.length > 0
		? `
## Code Structure
\`\`\`
${mod.path}/src/
${context.structure.map((s) => `├── ${s}`).join('\n')}
\`\`\``
		: ''
}
${
	context.features?.length > 0
		? `
## Features
${context.features.map((f) => `- ${f}`).join('\n')}`
		: ''
}
${
	context.readme
		? `
## From README
${context.readme.substring(0, 800)}${context.readme.length > 800 ? '...' : ''}`
		: ''
}

## How to Use This Agent
\`\`\`
"Read ${mod.path}/.agent/ and help me with..."
"As the ${name}, review this code"
\`\`\`
`;

	await fs.writeFile(path.join(agentDir, 'agent.md'), agentContent);

	// Create memory.md
	const memoryContent = `# ${name} - Memory

Auto-updated with learnings from code changes.

## Recent Updates

*No updates yet.*
`;
	await fs.writeFile(path.join(agentDir, 'memory.md'), memoryContent);

	// Update registry
	await updateRegistry(cwd, {
		path: mod.path,
		agent_dir: `${mod.path}/.agent`,
		name: name,
		watches: [`${mod.path}/**`],
	});
}

/**
 * Gather domain context - full version with README, features, structure
 */
async function gatherDomainContextLocal(fullPath, modulePath) {
	const context = {
		name: path.basename(modulePath),
		description: '',
		techStack: [],
		features: [],
		dependencies: [],
		readme: '',
		hasBackend: false,
		hasMobile: false,
		hasWeb: false,
		hasLanding: false,
		structure: [],
	};

	// Check for package.json
	const packageJsonPath = path.join(fullPath, 'package.json');
	if (await fs.pathExists(packageJsonPath)) {
		try {
			const pkg = await fs.readJson(packageJsonPath);
			context.description = pkg.description || '';
			context.dependencies = Object.keys(pkg.dependencies || {}).slice(0, 10);

			const deps = pkg.dependencies || {};
			if (deps['@nestjs/core']) context.techStack.push('NestJS');
			if (deps['svelte'] || deps['@sveltejs/kit']) context.techStack.push('SvelteKit');
			if (deps['expo'] || deps['react-native']) context.techStack.push('Expo/React Native');
			if (deps['astro']) context.techStack.push('Astro');
			if (deps['drizzle-orm']) context.techStack.push('Drizzle ORM');
			if (deps['@supabase/supabase-js']) context.techStack.push('Supabase');
			if (deps['better-auth']) context.techStack.push('Better Auth');
			if (deps['next']) context.techStack.push('Next.js');
			if (deps['react']) context.techStack.push('React');
			if (deps['vue']) context.techStack.push('Vue');
		} catch (e) {
			/* ignore */
		}
	}

	// Check for README
	for (const readmeName of ['README.md', 'readme.md']) {
		const readmePath = path.join(fullPath, readmeName);
		if (await fs.pathExists(readmePath)) {
			try {
				const content = await fs.readFile(readmePath, 'utf-8');
				context.readme = content.substring(0, 1500);

				// Extract features from README
				const featuresMatch = content.match(/## Features[\s\S]*?(?=##|$)/i);
				if (featuresMatch) {
					const featureLines = featuresMatch[0].match(/^[-*]\s+.+$/gm);
					if (featureLines) {
						context.features = featureLines.slice(0, 8).map((f) => f.replace(/^[-*]\s+/, ''));
					}
				}
			} catch (e) {
				/* ignore */
			}
			break;
		}
	}

	// Check for nested app structure (apps/chat/apps/backend, etc.)
	const appsDir = path.join(fullPath, 'apps');
	if (await fs.pathExists(appsDir)) {
		try {
			const subApps = await fs.readdir(appsDir);
			context.hasBackend = subApps.includes('backend');
			context.hasMobile = subApps.includes('mobile');
			context.hasWeb = subApps.includes('web');
			context.hasLanding = subApps.includes('landing');

			// Scan nested apps for tech stack
			for (const subApp of subApps) {
				const subPkgPath = path.join(appsDir, subApp, 'package.json');
				if (await fs.pathExists(subPkgPath)) {
					try {
						const subPkg = await fs.readJson(subPkgPath);
						const deps = subPkg.dependencies || {};
						if (deps['@nestjs/core'] && !context.techStack.includes('NestJS'))
							context.techStack.push('NestJS');
						if (
							(deps['svelte'] || deps['@sveltejs/kit']) &&
							!context.techStack.includes('SvelteKit')
						)
							context.techStack.push('SvelteKit');
						if (
							(deps['expo'] || deps['react-native']) &&
							!context.techStack.includes('Expo/React Native')
						)
							context.techStack.push('Expo/React Native');
						if (deps['astro'] && !context.techStack.includes('Astro'))
							context.techStack.push('Astro');
					} catch (e) {
						/* ignore */
					}
				}
			}
		} catch (e) {
			/* ignore */
		}
	}

	// Scan src directory for structure
	const srcDir = path.join(fullPath, 'src');
	if (await fs.pathExists(srcDir)) {
		try {
			const srcContents = await fs.readdir(srcDir);
			context.structure = srcContents.filter((f) => !f.startsWith('.')).slice(0, 10);
		} catch (e) {
			/* ignore */
		}
	}

	return context;
}

export async function scanCommand(options) {
	const cwd = process.cwd();

	// Claude mode - generate prompt for Claude Code
	if (options.claude) {
		await generateClaudePrompt(cwd);
		return;
	}

	// Init with Claude - generate prompt for Claude to create rich agents
	if (options.initClaude) {
		await generateClaudeInitPrompt(cwd, options);
		return;
	}

	// Setup all mode - bulk create agents
	if (options.setupAll) {
		await setupAllAgents(cwd, options);
		return;
	}

	console.log(chalk.blue('\n🔍 Scanning project structure...\n'));

	const spinner = ora('Analyzing directories...').start();

	try {
		// Discover project structure
		const structure = await discoverStructure(cwd, options.depth || 4);
		spinner.succeed(`Found ${structure.total} potential modules\n`);

		// Display discovered structure
		console.log(chalk.cyan('📁 Discovered Structure:\n'));

		// Group by type
		const byType = groupByType(structure.modules);

		for (const [type, modules] of Object.entries(byType)) {
			console.log(chalk.yellow(`  ${getTypeIcon(type)} ${type} (${modules.length})`));

			const displayModules = options.all ? modules : modules.slice(0, 5);
			for (const mod of displayModules) {
				const priority = getPriority(mod);
				const priorityIcon = priority === 'high' ? '⭐' : priority === 'medium' ? '○' : '·';
				console.log(chalk.gray(`    ${priorityIcon} ${mod.path}`));
			}

			if (!options.all && modules.length > 5) {
				console.log(chalk.gray(`    ... and ${modules.length - 5} more`));
			}
		}

		// Suggest high-priority agents
		console.log(chalk.cyan('\n🎯 Recommended Agents (high priority):\n'));

		const recommended = structure.modules.filter((m) => getPriority(m) === 'high').slice(0, 10);

		for (const mod of recommended) {
			console.log(chalk.white(`  ${mod.path}`));
			console.log(chalk.gray(`    Type: ${mod.type} | Reason: ${mod.reason || 'core module'}`));
		}

		// Interactive mode - ask to create agents
		if (!options.json && !options.dryRun) {
			console.log('');

			const { action } = await inquirer.prompt([
				{
					type: 'list',
					name: 'action',
					message: 'What would you like to do?',
					choices: [
						{ name: 'Create agents for recommended modules', value: 'recommended' },
						{ name: 'Select specific modules', value: 'select' },
						{ name: 'Export discovery to file', value: 'export' },
						{ name: 'Exit', value: 'exit' },
					],
				},
			]);

			if (action === 'recommended') {
				await createAgentsForModules(cwd, recommended);
			} else if (action === 'select') {
				const { selected } = await inquirer.prompt([
					{
						type: 'checkbox',
						name: 'selected',
						message: 'Select modules to create agents for:',
						choices: structure.modules.map((m) => ({
							name: `${m.path} (${m.type})`,
							value: m,
							checked: getPriority(m) === 'high',
						})),
						pageSize: 20,
					},
				]);

				if (selected.length > 0) {
					await createAgentsForModules(cwd, selected);
				}
			} else if (action === 'export') {
				const exportPath = path.join(cwd, '.knowledge', 'discovered-structure.yaml');
				await fs.ensureDir(path.dirname(exportPath));
				await fs.writeFile(exportPath, yaml.stringify(structure));
				console.log(chalk.green(`\n✓ Exported to ${exportPath}`));
			}
		}

		// JSON output for scripting
		if (options.json) {
			console.log(JSON.stringify(structure, null, 2));
		}
	} catch (error) {
		spinner.fail('Scan failed');
		console.error(chalk.red(error.message));
		process.exit(1);
	}
}

async function discoverStructure(cwd, maxDepth) {
	const modules = [];
	const visited = new Set();

	async function scan(dir, depth = 0) {
		if (depth > maxDepth) return;
		if (visited.has(dir)) return;
		visited.add(dir);

		const relativePath = path.relative(cwd, dir);

		// Skip common non-code directories
		const basename = path.basename(dir);
		if (shouldSkip(basename)) return;

		// Check if this is a module (has package.json, src/, etc.)
		const moduleInfo = await detectModule(dir, relativePath);
		if (moduleInfo) {
			modules.push(moduleInfo);
		}

		// Scan subdirectories
		try {
			const entries = await fs.readdir(dir, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory() && !shouldSkip(entry.name)) {
					await scan(path.join(dir, entry.name), depth + 1);
				}
			}
		} catch (e) {
			// Permission denied or other error
		}
	}

	await scan(cwd);

	// Sort by priority and path
	modules.sort((a, b) => {
		const priorityOrder = { high: 0, medium: 1, low: 2 };
		const aPriority = priorityOrder[getPriority(a)] || 2;
		const bPriority = priorityOrder[getPriority(b)] || 2;
		if (aPriority !== bPriority) return aPriority - bPriority;
		return a.path.localeCompare(b.path);
	});

	return {
		total: modules.length,
		modules,
		scannedAt: new Date().toISOString(),
	};
}

async function detectModule(dir, relativePath) {
	// Skip root
	if (!relativePath || relativePath === '.') return null;

	const hasPackageJson = await fs.pathExists(path.join(dir, 'package.json'));
	const hasSrc = await fs.pathExists(path.join(dir, 'src'));
	const hasLib = await fs.pathExists(path.join(dir, 'lib'));
	const hasIndex =
		(await fs.pathExists(path.join(dir, 'index.ts'))) ||
		(await fs.pathExists(path.join(dir, 'index.js')));

	// Must have some indicator of being a module
	if (!hasPackageJson && !hasSrc && !hasLib && !hasIndex) {
		return null;
	}

	// Determine type
	let type = 'unknown';
	let reason = '';

	// Check path patterns
	const pathLower = relativePath.toLowerCase();

	if (pathLower.startsWith('packages/')) {
		type = 'package';
	} else if (pathLower.startsWith('apps/') && pathLower.includes('/apps/backend')) {
		type = 'nested-backend';
	} else if (pathLower.startsWith('apps/') && pathLower.includes('/apps/mobile')) {
		type = 'nested-mobile';
	} else if (pathLower.startsWith('apps/') && pathLower.includes('/apps/web')) {
		type = 'nested-web';
	} else if (pathLower.startsWith('apps/') && pathLower.includes('/apps/landing')) {
		type = 'nested-landing';
	} else if (pathLower.startsWith('apps/') && !pathLower.includes('/apps/')) {
		type = 'app';
	} else if (pathLower.startsWith('services/')) {
		type = 'service';
	} else if (pathLower.startsWith('libs/') || pathLower.startsWith('shared/')) {
		type = 'library';
	}

	// Check for high-value keywords
	for (const keyword of HIGH_VALUE_KEYWORDS) {
		if (pathLower.includes(keyword)) {
			reason = `Contains "${keyword}"`;
			break;
		}
	}

	// Get package name if available
	let packageName = null;
	if (hasPackageJson) {
		try {
			const pkg = await fs.readJson(path.join(dir, 'package.json'));
			packageName = pkg.name;
		} catch (e) {
			// Ignore
		}
	}

	// Detect tech stack
	const techStack = await detectTechStack(dir);

	return {
		path: relativePath,
		type,
		packageName,
		techStack,
		reason,
		hasPackageJson,
		hasSrc,
	};
}

async function detectTechStack(dir) {
	const stack = [];

	const checks = [
		{ file: 'nest-cli.json', tech: 'NestJS' },
		{ file: 'next.config.js', tech: 'Next.js' },
		{ file: 'next.config.mjs', tech: 'Next.js' },
		{ file: 'svelte.config.js', tech: 'SvelteKit' },
		{ file: 'astro.config.mjs', tech: 'Astro' },
		{ file: 'app.json', tech: 'Expo' },
		{ file: 'expo.json', tech: 'Expo' },
		{ file: 'vite.config.ts', tech: 'Vite' },
		{ file: 'drizzle.config.ts', tech: 'Drizzle' },
		{ file: 'prisma/schema.prisma', tech: 'Prisma' },
		{ file: 'tailwind.config.js', tech: 'Tailwind' },
		{ file: 'tailwind.config.ts', tech: 'Tailwind' },
	];

	for (const check of checks) {
		if (await fs.pathExists(path.join(dir, check.file))) {
			stack.push(check.tech);
		}
	}

	return stack;
}

function shouldSkip(name) {
	const skipDirs = [
		'node_modules',
		'.git',
		'.next',
		'.svelte-kit',
		'.astro',
		'dist',
		'build',
		'out',
		'coverage',
		'.turbo',
		'.cache',
		'.knowledge',
		'.agent',
		'__pycache__',
		'.expo',
	];
	return skipDirs.includes(name) || name.startsWith('.');
}

function getPriority(mod) {
	const pathLower = mod.path.toLowerCase();

	// High priority: shared packages with key functionality
	if (HIGH_VALUE_KEYWORDS.some((kw) => pathLower.includes(kw))) {
		return 'high';
	}

	// High priority: services
	if (mod.type === 'service') {
		return 'high';
	}

	// Medium priority: main apps
	if (mod.type === 'app') {
		return 'medium';
	}

	// Medium priority: packages in general
	if (mod.type === 'package') {
		return 'medium';
	}

	// Low priority: nested sub-apps
	if (mod.type.startsWith('nested-')) {
		return 'low';
	}

	return 'low';
}

function groupByType(modules) {
	const groups = {};
	for (const mod of modules) {
		const type = mod.type || 'other';
		if (!groups[type]) groups[type] = [];
		groups[type].push(mod);
	}
	return groups;
}

function getTypeIcon(type) {
	const icons = {
		package: '📦',
		library: '📚',
		shared: '🔗',
		app: '📱',
		service: '⚙️',
		backend: '🖥️',
		api: '🔌',
		'nested-backend': '🖥️',
		'nested-mobile': '📱',
		'nested-web': '🌐',
		'nested-landing': '🏠',
		unknown: '❓',
	};
	return icons[type] || '📁';
}

async function createAgentsForModules(cwd, modules) {
	console.log(chalk.blue(`\n📝 Creating ${modules.length} agents...\n`));

	// Check if initialized
	if (!(await fs.pathExists(path.join(cwd, '.knowledge')))) {
		console.log(chalk.yellow('Agent Knowledge System not initialized.'));
		const { init } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'init',
				message: 'Initialize now?',
				default: true,
			},
		]);

		if (init) {
			const { initCommand } = await import('./init.js');
			await initCommand({});
		} else {
			return;
		}
	}

	// Create each agent
	for (const mod of modules) {
		console.log(chalk.gray(`Creating agent for ${mod.path}...`));

		try {
			const { addAgentCommand } = await import('./add-agent.js');

			// Determine smart defaults based on discovery
			const name = generateAgentName(mod);
			const watches = generateWatchPatterns(mod);

			// Create agent directory
			const agentDir = path.join(cwd, mod.path, '.agent');
			await fs.ensureDir(agentDir);

			// Generate agent.md
			const agentContent = generateAgentContent(mod, name);
			await fs.writeFile(path.join(agentDir, 'agent.md'), agentContent);

			// Generate memory.md
			const memoryContent = `# ${name} - Memory

This file is automatically updated with learnings from code changes.

## Recent Updates

*No updates yet. Memory will be populated after code changes are processed.*

---

## Initial Context

- **Type:** ${mod.type}
- **Package:** ${mod.packageName || 'N/A'}
- **Tech Stack:** ${mod.techStack?.join(', ') || 'Unknown'}
`;
			await fs.writeFile(path.join(agentDir, 'memory.md'), memoryContent);

			// Generate architecture.md
			const archContent = `# ${name.replace(' Expert', '')} Architecture

## Overview

*Document the architecture of this module here.*

## Tech Stack

${mod.techStack?.map((t) => `- ${t}`).join('\n') || '- Unknown'}

## Key Files

*List important files and their purposes.*

## Dependencies

*Document key dependencies.*
`;
			await fs.writeFile(path.join(agentDir, 'architecture.md'), archContent);

			// Update registry
			await updateRegistry(cwd, {
				path: mod.path,
				agent_dir: `${mod.path}/.agent`,
				name: name,
				watches: watches,
			});

			console.log(chalk.green(`  ✓ Created ${mod.path}/.agent/`));
		} catch (error) {
			console.log(chalk.red(`  ✗ Failed: ${error.message}`));
		}
	}

	console.log(chalk.green(`\n✅ Created ${modules.length} agents`));
	console.log(chalk.gray('\nNext: Make some commits, then run:'));
	console.log(chalk.white('  npx agent-knowledge update\n'));
}

function generateAgentName(mod) {
	const pathParts = mod.path.split('/');
	const name = pathParts[pathParts.length - 1];

	// Convert to title case
	const titleCase = name
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');

	// Add type suffix
	const typeSuffix = {
		service: 'Service Expert',
		backend: 'Backend Expert',
		'nested-backend': 'Backend Expert',
		'nested-mobile': 'Mobile Expert',
		'nested-web': 'Web Expert',
		package: 'Expert',
		app: 'Expert',
	};

	return `${titleCase} ${typeSuffix[mod.type] || 'Expert'}`;
}

function generateWatchPatterns(mod) {
	const patterns = [`${mod.path}/**`];

	// Add related patterns based on naming conventions
	const name = path.basename(mod.path);

	// If it's a shared package, watch consumers
	if (mod.path.startsWith('packages/shared-')) {
		patterns.push(`apps/*/apps/**/${name}*`);
	}

	// If it's a database package, watch related backend
	if (name.includes('database')) {
		const appName = name.replace('-database', '');
		patterns.push(`apps/${appName}/apps/backend/**`);
	}

	return patterns;
}

function generateAgentContent(mod, name) {
	const techList =
		mod.techStack?.length > 0 ? mod.techStack.map((t) => `- ${t}`).join('\n') : '- TypeScript';

	return `# ${name}

## Identity
You are the **${name}** for this codebase. You have deep knowledge of the
${mod.path} module, its patterns, APIs, and implementation details.

## Role
${getRoleForType(mod.type)}

## Tech Stack
${techList}

## Expertise
${getExpertiseForType(mod.type, mod.path)}

## Principles
1. Understand existing patterns before suggesting changes
2. Maintain consistency with established conventions
3. Consider impacts on consumers of this module
4. Document breaking changes clearly
5. Write tests for all changes

## Key Paths
- Source: \`${mod.path}/src/\`
- Tests: \`${mod.path}/test/\` or \`${mod.path}/__tests__/\`

## How to Use This Agent
When working on this module:
1. Read this file and memory.md for context
2. Check architecture.md for structural understanding
3. Reference memory.md for recent changes and decisions
`;
}

function getRoleForType(type) {
	const roles = {
		service: 'Service Architecture & API Design Specialist',
		backend: 'Backend Development & API Specialist',
		'nested-backend': 'Backend Development & API Specialist',
		'nested-mobile': 'Mobile Development & UX Specialist',
		'nested-web': 'Web Development & Frontend Specialist',
		'nested-landing': 'Landing Page & Marketing Site Specialist',
		package: 'Package Development & API Design Specialist',
		library: 'Library Development & Documentation Specialist',
		app: 'Application Development Specialist',
	};
	return roles[type] || 'Development Specialist';
}

function getExpertiseForType(type, modulePath) {
	const pathLower = modulePath.toLowerCase();

	// Check for specific domains
	if (pathLower.includes('auth')) {
		return `- Authentication flows
- Authorization & permissions
- JWT/Session handling
- Security best practices`;
	}

	if (pathLower.includes('ui') || pathLower.includes('component')) {
		return `- UI component architecture
- Design system patterns
- Accessibility
- Responsive design`;
	}

	if (pathLower.includes('database') || pathLower.includes('db')) {
		return `- Database schema design
- Query optimization
- Migrations
- Data modeling`;
	}

	if (pathLower.includes('api') || pathLower.includes('client')) {
		return `- API design patterns
- HTTP/REST conventions
- Error handling
- Type safety`;
	}

	// Default by type
	const expertise = {
		service: `- Service architecture
- API design
- Inter-service communication
- Error handling`,
		backend: `- API endpoints
- Business logic
- Database operations
- Authentication integration`,
		'nested-mobile': `- React Native patterns
- Mobile UX
- Platform-specific code
- Performance optimization`,
		'nested-web': `- Frontend architecture
- State management
- Component patterns
- Performance optimization`,
		package: `- Package API design
- Documentation
- Versioning
- Consumer patterns`,
	};

	return (
		expertise[type] ||
		`- Module internals
- API patterns
- Best practices
- Testing strategies`
	);
}

async function updateRegistry(cwd, agent) {
	const registryPath = path.join(cwd, '.knowledge', 'agent-registry.yaml');
	let registry = { agents: [] };

	if (await fs.pathExists(registryPath)) {
		const content = await fs.readFile(registryPath, 'utf-8');
		registry = yaml.parse(content) || { agents: [] };
	}

	// Remove existing entry for this path
	registry.agents = registry.agents.filter((a) => a.path !== agent.path);

	// Add new entry
	registry.agents.push(agent);

	await fs.writeFile(registryPath, yaml.stringify(registry));
}
