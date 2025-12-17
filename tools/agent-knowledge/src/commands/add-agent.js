import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export async function addAgentCommand(modulePath, options) {
	const cwd = process.cwd();
	const fullPath = path.join(cwd, modulePath);
	const agentDir = path.join(fullPath, '.agent');

	console.log(chalk.blue(`\n🤖 Adding agent for: ${modulePath}\n`));

	// Validate path exists
	if (!(await fs.pathExists(fullPath))) {
		console.log(chalk.red(`Error: Path does not exist: ${fullPath}`));
		process.exit(1);
	}

	// Check if agent already exists
	if (await fs.pathExists(agentDir)) {
		const { overwrite } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'overwrite',
				message: '.agent directory already exists. Overwrite?',
				default: false,
			},
		]);

		if (!overwrite) {
			console.log(chalk.yellow('Aborted.'));
			return;
		}
	}

	// Create .knowledge directory if needed (Claude Code only mode)
	const knowledgeDir = path.join(cwd, '.knowledge');
	if (!(await fs.pathExists(knowledgeDir))) {
		await fs.ensureDir(knowledgeDir);
		await fs.writeFile(path.join(knowledgeDir, 'agent-registry.yaml'), 'agents: []\n');
		console.log(chalk.gray('Created .knowledge/ directory (Claude Code only mode)\n'));
	}

	// Gather agent information
	const moduleName = path.basename(modulePath);
	const parentDir = path.basename(path.dirname(modulePath));

	const answers = await inquirer.prompt([
		{
			type: 'input',
			name: 'name',
			message: 'Agent display name:',
			default: options.name || `${formatName(moduleName)} Expert`,
		},
		{
			type: 'input',
			name: 'role',
			message: 'Agent role/title:',
			default: `${formatName(moduleName)} Specialist`,
		},
		{
			type: 'input',
			name: 'expertise',
			message: 'Primary expertise (comma-separated):',
			default: guessExpertise(moduleName),
		},
		{
			type: 'editor',
			name: 'description',
			message: 'Agent identity/description (opens editor):',
			default: `Deep expert in the ${moduleName} module. Understands all patterns, APIs, and implementation details.`,
		},
		{
			type: 'input',
			name: 'watches',
			message: 'Watch patterns (comma-separated, supports globs):',
			default: [modulePath + '/**', ...(options.watches || [])].join(', '),
		},
		{
			type: 'confirm',
			name: 'scanForContext',
			message: 'Scan module for initial context (package.json, README, etc)?',
			default: true,
		},
	]);

	const spinner = ora('Creating agent...').start();

	try {
		// Create .agent directory
		await fs.ensureDir(agentDir);

		// Scan for initial context if requested
		let initialContext = '';
		if (answers.scanForContext) {
			initialContext = await scanModuleContext(fullPath);
		}

		// Create agent.md
		const agentContent = `# ${answers.name}

## Identity
You are the **${answers.name}** for this codebase. ${answers.description}

## Role
${answers.role}

## Expertise
${answers.expertise
	.split(',')
	.map((e) => `- ${e.trim()}`)
	.join('\n')}

## Principles
1. Understand existing patterns before suggesting changes
2. Maintain consistency with the module's established conventions
3. Consider impacts on consumers of this module
4. Document breaking changes clearly
5. Write tests for all changes

## Key Paths
- Source: \`${modulePath}/src/\`
- Tests: \`${modulePath}/test/\` or \`${modulePath}/__tests__/\`
- Types: \`${modulePath}/types/\` or \`${modulePath}/src/types/\`

## How to Use This Agent
When working on ${moduleName}:
1. Read this file and memory.md for context
2. Check architecture.md for structural understanding
3. Reference memory.md for recent changes and decisions
`;

		await fs.writeFile(path.join(agentDir, 'agent.md'), agentContent);
		spinner.succeed('Created .agent/agent.md');

		// Create memory.md
		spinner.start('Creating memory.md...');
		const memoryContent = `# ${answers.name} - Memory

This file is automatically updated with learnings from code changes.

## Recent Updates

*No updates yet. Memory will be populated after code changes are processed.*

---

## Historical Context

${initialContext || '*Initial context will be added here.*'}
`;

		await fs.writeFile(path.join(agentDir, 'memory.md'), memoryContent);
		spinner.succeed('Created .agent/memory.md');

		// Create architecture.md
		spinner.start('Creating architecture.md...');
		const architectureContent = `# ${formatName(moduleName)} Architecture

## Overview

*Document the high-level architecture of this module here.*

## Directory Structure

\`\`\`
${modulePath}/
├── src/           # Source code
├── test/          # Tests
├── types/         # TypeScript types (if applicable)
└── package.json   # Dependencies
\`\`\`

## Key Components

*List and describe the main components/files here.*

## Dependencies

*Document key dependencies and why they're used.*

## Integration Points

*How other modules/apps interact with this module.*
`;

		await fs.writeFile(path.join(agentDir, 'architecture.md'), architectureContent);
		spinner.succeed('Created .agent/architecture.md');

		// Update agent registry
		spinner.start('Updating agent registry...');
		await updateRegistry(cwd, {
			path: modulePath,
			agent_dir: path.join(modulePath, '.agent'),
			name: answers.name,
			watches: answers.watches.split(',').map((w) => w.trim()),
		});
		spinner.succeed('Updated .knowledge/agent-registry.yaml');

		console.log(chalk.green(`\n✅ Agent created successfully at ${modulePath}/.agent/\n`));

		console.log(chalk.cyan('Files created:'));
		console.log(chalk.gray(`  ${modulePath}/.agent/agent.md      - Agent persona & instructions`));
		console.log(chalk.gray(`  ${modulePath}/.agent/memory.md     - Auto-updated knowledge`));
		console.log(
			chalk.gray(`  ${modulePath}/.agent/architecture.md - Architecture docs (edit manually)`)
		);

		console.log(chalk.cyan('\nNext steps:'));
		console.log(chalk.white('  1. Review and customize .agent/agent.md'));
		console.log(chalk.white('  2. Document architecture in .agent/architecture.md'));
		console.log(chalk.white('  3. Make commits - changes will be tracked automatically'));
		console.log(chalk.white('  4. Run update to populate memory:'));
		console.log(chalk.gray('     npx agent-knowledge update\n'));
	} catch (error) {
		spinner.fail('Failed to create agent');
		console.error(chalk.red(error.message));
		process.exit(1);
	}
}

function formatName(name) {
	return name
		.split(/[-_]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

function guessExpertise(moduleName) {
	const expertiseMap = {
		auth: 'Authentication, Authorization, OAuth, JWT, Sessions, Security',
		ui: 'React Components, Design System, Accessibility, Styling',
		api: 'REST APIs, GraphQL, HTTP, Request Handling, Middleware',
		database: 'SQL, Migrations, ORM, Query Optimization, Data Modeling',
		utils: 'Utility Functions, Helpers, Common Patterns',
		core: 'Core Business Logic, Domain Models, Validation',
		config: 'Configuration Management, Environment Variables, Feature Flags',
	};

	for (const [key, expertise] of Object.entries(expertiseMap)) {
		if (moduleName.toLowerCase().includes(key)) {
			return expertise;
		}
	}

	return 'Module internals, APIs, Patterns, Best Practices';
}

async function scanModuleContext(modulePath) {
	let context = '';

	// Check for package.json
	const packagePath = path.join(modulePath, 'package.json');
	if (await fs.pathExists(packagePath)) {
		const pkg = await fs.readJson(packagePath);
		context += `### Package Info\n`;
		context += `- Name: ${pkg.name || 'unknown'}\n`;
		context += `- Version: ${pkg.version || 'unknown'}\n`;
		if (pkg.description) {
			context += `- Description: ${pkg.description}\n`;
		}
		if (pkg.dependencies) {
			context += `- Key dependencies: ${Object.keys(pkg.dependencies).slice(0, 5).join(', ')}\n`;
		}
		context += '\n';
	}

	// Check for README
	const readmePaths = ['README.md', 'readme.md', 'README.MD'];
	for (const readmeName of readmePaths) {
		const readmePath = path.join(modulePath, readmeName);
		if (await fs.pathExists(readmePath)) {
			const readme = await fs.readFile(readmePath, 'utf-8');
			// Take first 500 chars
			context += `### From README\n`;
			context += readme.substring(0, 500).trim();
			if (readme.length > 500) context += '...';
			context += '\n\n';
			break;
		}
	}

	return context;
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
