import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

export async function initCommand(options) {
	const cwd = process.cwd();

	console.log(chalk.blue('\n📦 Initializing Agent Knowledge System...\n'));

	// Check if already initialized
	if (await fs.pathExists(path.join(cwd, '.knowledge'))) {
		const { overwrite } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'overwrite',
				message: '.knowledge directory already exists. Reinitialize?',
				default: false,
			},
		]);

		if (!overwrite) {
			console.log(chalk.yellow('Aborted.'));
			return;
		}
	}

	// Gather configuration
	const answers = await inquirer.prompt([
		{
			type: 'list',
			name: 'provider',
			message: 'Select your primary LLM provider:',
			choices: [
				{ name: 'OpenRouter (recommended - access to many models)', value: 'openrouter' },
				{ name: 'Anthropic (Claude direct)', value: 'anthropic' },
			],
			default: options.provider,
		},
		{
			type: 'list',
			name: 'model',
			message: 'Select default model for knowledge updates:',
			choices: (ans) =>
				ans.provider === 'openrouter'
					? [
							{
								name: 'google/gemini-flash-1.5 (cheapest - $0.075/1M)',
								value: 'google/gemini-flash-1.5',
							},
							{
								name: 'deepseek/deepseek-chat (very cheap - $0.14/1M)',
								value: 'deepseek/deepseek-chat',
							},
							{
								name: 'anthropic/claude-3-haiku (reliable - $0.25/1M)',
								value: 'anthropic/claude-3-haiku',
							},
							{
								name: 'anthropic/claude-sonnet-4-20250514 (best quality - $3/1M)',
								value: 'anthropic/claude-sonnet-4-20250514',
							},
						]
					: [
							{ name: 'claude-3-haiku-20240307 (fast)', value: 'claude-3-haiku-20240307' },
							{ name: 'claude-sonnet-4-20250514 (balanced)', value: 'claude-sonnet-4-20250514' },
						],
			default: options.model,
		},
		{
			type: 'input',
			name: 'apiKey',
			message: (ans) =>
				`Enter your ${ans.provider === 'openrouter' ? 'OpenRouter' : 'Anthropic'} API key:`,
			validate: (input) => input.length > 10 || 'Please enter a valid API key',
		},
		{
			type: 'confirm',
			name: 'installHooks',
			message: 'Install git hooks for automatic change tracking?',
			default: options.hooks !== false,
		},
		{
			type: 'confirm',
			name: 'addToGitignore',
			message: 'Add sensitive files to .gitignore?',
			default: true,
		},
		{
			type: 'confirm',
			name: 'createClaudeConfig',
			message: 'Create CLAUDE.md configuration for Claude Code integration?',
			default: true,
		},
	]);

	const spinner = ora('Creating directory structure...').start();

	try {
		// 1. Create .knowledge directory structure
		await fs.ensureDir(path.join(cwd, '.knowledge', 'archive'));

		// 2. Create config file
		const config = {
			version: '1.0.0',
			provider: answers.provider,
			model: answers.model,
			models: {
				batch: {
					provider: answers.provider,
					model: answers.model,
				},
				quality: {
					provider: answers.provider,
					model:
						answers.provider === 'openrouter'
							? 'anthropic/claude-sonnet-4-20250514'
							: 'claude-sonnet-4-20250514',
				},
				fallbacks:
					answers.provider === 'openrouter'
						? [
								{ provider: 'openrouter', model: 'anthropic/claude-3-haiku' },
								{ provider: 'openrouter', model: 'google/gemini-flash-1.5' },
							]
						: [],
			},
			budget: {
				daily_limit_usd: 1.0,
				alert_threshold: 0.8,
			},
		};

		await fs.writeFile(path.join(cwd, '.knowledge', 'config.yaml'), generateYaml(config));
		spinner.succeed('Created .knowledge/config.yaml');

		// 3. Create agent registry
		spinner.start('Creating agent registry...');
		const registry = {
			agents: [],
		};
		await fs.writeFile(path.join(cwd, '.knowledge', 'agent-registry.yaml'), generateYaml(registry));
		spinner.succeed('Created .knowledge/agent-registry.yaml');

		// 4. Create empty changes file
		await fs.writeFile(path.join(cwd, '.knowledge', 'changes.jsonl'), '');

		// 5. Create .env file for API key
		spinner.start('Creating environment file...');
		const envContent =
			answers.provider === 'openrouter'
				? `# Agent Knowledge System Configuration
OPENROUTER_API_KEY=${answers.apiKey}
LLM_PROVIDER=openrouter
OPENROUTER_MODEL=${answers.model}
`
				: `# Agent Knowledge System Configuration
ANTHROPIC_API_KEY=${answers.apiKey}
LLM_PROVIDER=anthropic
ANTHROPIC_MODEL=${answers.model}
`;
		await fs.writeFile(path.join(cwd, '.knowledge', '.env'), envContent);
		spinner.succeed('Created .knowledge/.env');

		// 6. Install git hooks
		if (answers.installHooks) {
			spinner.start('Installing git hooks...');
			await installGitHooks(cwd);
			spinner.succeed('Installed git hooks');
		}

		// 7. Update .gitignore
		if (answers.addToGitignore) {
			spinner.start('Updating .gitignore...');
			await updateGitignore(cwd);
			spinner.succeed('Updated .gitignore');
		}

		// 8. Create CLAUDE.md integration
		if (answers.createClaudeConfig) {
			spinner.start('Creating Claude Code integration...');
			await createClaudeConfig(cwd);
			spinner.succeed('Created/updated CLAUDE.md');
		}

		// 9. Create update script
		spinner.start('Creating update scripts...');
		await fs.ensureDir(path.join(cwd, 'scripts', 'agents'));
		await fs.copyFile(
			path.join(TEMPLATES_DIR, 'update-agents.js'),
			path.join(cwd, 'scripts', 'agents', 'update-agents.js')
		);
		spinner.succeed('Created scripts/agents/update-agents.js');

		console.log(chalk.green('\n✅ Agent Knowledge System initialized successfully!\n'));

		console.log(chalk.cyan('Next steps:'));
		console.log(chalk.white('  1. Add agents to your modules:'));
		console.log(chalk.gray('     npx agent-knowledge add-agent packages/shared-auth'));
		console.log(chalk.white('  2. Make some commits and watch changes being tracked'));
		console.log(chalk.white('  3. Run manual update or set up cron job:'));
		console.log(chalk.gray('     npx agent-knowledge update'));
		console.log(chalk.white('  4. Set up nightly cron (optional):'));
		console.log(chalk.gray('     0 3 * * * cd /your/project && npx agent-knowledge update\n'));
	} catch (error) {
		spinner.fail('Initialization failed');
		console.error(chalk.red(error.message));
		process.exit(1);
	}
}

async function installGitHooks(cwd) {
	const hooksDir = path.join(cwd, '.git', 'hooks');

	if (!(await fs.pathExists(path.join(cwd, '.git')))) {
		console.log(chalk.yellow('  Warning: Not a git repository, skipping hooks'));
		return;
	}

	await fs.ensureDir(hooksDir);

	const hookContent = `#!/bin/bash
# Agent Knowledge System - Change Tracker
# Appends commit changes to .knowledge/changes.jsonl

CHANGES_FILE=".knowledge/changes.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_SHA=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s" | sed 's/"/\\\\"/g')
AUTHOR=$(git log -1 --pretty=format:"%an")
BRANCH=$(git branch --show-current)

# Only track if .knowledge exists
if [ ! -d ".knowledge" ]; then
  exit 0
fi

# Get changed files
git diff-tree --no-commit-id --name-status -r HEAD | while read status file; do
    # Determine module from path
    MODULE=$(echo "$file" | cut -d'/' -f1-2)

    # Get truncated diff
    DIFF=$(git show HEAD -- "$file" 2>/dev/null | head -50 | sed 's/"/\\\\"/g' | tr '\\n' '\\\\n' | head -c 2000)

    # Append to changes log
    echo "{\\"timestamp\\":\\"$TIMESTAMP\\",\\"commit\\":\\"$COMMIT_SHA\\",\\"message\\":\\"$COMMIT_MSG\\",\\"author\\":\\"$AUTHOR\\",\\"branch\\":\\"$BRANCH\\",\\"module\\":\\"$MODULE\\",\\"file\\":\\"$file\\",\\"status\\":\\"$status\\",\\"diff\\":\\"$DIFF\\"}" >> "$CHANGES_FILE"
done

echo "📝 Changes logged for agent knowledge system"
`;

	const hookPath = path.join(hooksDir, 'post-commit');

	// Check if hook exists and has other content
	if (await fs.pathExists(hookPath)) {
		const existing = await fs.readFile(hookPath, 'utf-8');
		if (!existing.includes('Agent Knowledge System')) {
			// Append to existing hook
			await fs.appendFile(hookPath, '\n\n' + hookContent);
		}
	} else {
		await fs.writeFile(hookPath, hookContent);
	}

	await fs.chmod(hookPath, '755');
}

async function updateGitignore(cwd) {
	const gitignorePath = path.join(cwd, '.gitignore');
	const additions = `
# Agent Knowledge System
.knowledge/.env
.knowledge/archive/
`;

	if (await fs.pathExists(gitignorePath)) {
		const existing = await fs.readFile(gitignorePath, 'utf-8');
		if (!existing.includes('Agent Knowledge System')) {
			await fs.appendFile(gitignorePath, additions);
		}
	} else {
		await fs.writeFile(gitignorePath, additions.trim());
	}
}

async function createClaudeConfig(cwd) {
	const claudePath = path.join(cwd, 'CLAUDE.md');

	const agentSection = `
## Agent Knowledge System

This project uses specialized AI agents with auto-updating knowledge. When working on a specific module:

1. Check if \`.agent/agent.md\` exists in the directory you're working in
2. If found, read all files in \`.agent/\` to load domain knowledge
3. Adopt that agent's persona, expertise, and principles
4. Reference the memory.md for recent changes and context

### Finding Agents

Search for agents with: \`find . -name "agent.md" -path "*/.agent/*"\`

### Agent Structure

Each \`.agent/\` folder contains:
- \`agent.md\` - Persona, role, expertise, principles
- \`memory.md\` - Auto-updated knowledge from code changes
- \`architecture.md\` - Module architecture (manual)
- Additional context files as needed
`;

	if (await fs.pathExists(claudePath)) {
		const existing = await fs.readFile(claudePath, 'utf-8');
		if (!existing.includes('Agent Knowledge System')) {
			await fs.appendFile(claudePath, '\n' + agentSection);
		}
	} else {
		await fs.writeFile(
			claudePath,
			`# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
${agentSection}`
		);
	}
}

function generateYaml(obj, indent = 0) {
	let yaml = '';
	const spaces = '  '.repeat(indent);

	for (const [key, value] of Object.entries(obj)) {
		if (Array.isArray(value)) {
			yaml += `${spaces}${key}:\n`;
			for (const item of value) {
				if (typeof item === 'object') {
					yaml += `${spaces}  -\n`;
					for (const [k, v] of Object.entries(item)) {
						yaml += `${spaces}    ${k}: ${v}\n`;
					}
				} else {
					yaml += `${spaces}  - ${item}\n`;
				}
			}
		} else if (typeof value === 'object' && value !== null) {
			yaml += `${spaces}${key}:\n`;
			yaml += generateYaml(value, indent + 1);
		} else {
			yaml += `${spaces}${key}: ${value}\n`;
		}
	}

	return yaml;
}
