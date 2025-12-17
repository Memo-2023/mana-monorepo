#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { initCommand } from '../src/commands/init.js';
import { addAgentCommand } from '../src/commands/add-agent.js';
import { updateCommand } from '../src/commands/update.js';
import { statusCommand } from '../src/commands/status.js';
import { setupHooksCommand } from '../src/commands/setup-hooks.js';
import { scanCommand } from '../src/commands/scan.js';
import { teamCommand } from '../src/commands/team.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

console.log(
	chalk.cyan(`
  ╔═══════════════════════════════════════════╗
  ║  ${chalk.bold('Agent Knowledge System')} v${pkg.version}           ║
  ║  AI agents that learn from your code      ║
  ╚═══════════════════════════════════════════╝
`)
);

program
	.name('agent-knowledge')
	.description('Auto-updating AI agent knowledge system for codebases')
	.version(pkg.version);

program
	.command('init')
	.description('Initialize agent knowledge system in current project')
	.option('-p, --provider <provider>', 'LLM provider (anthropic|openrouter)', 'openrouter')
	.option('-m, --model <model>', 'Default model to use', 'google/gemini-flash-1.5')
	.option('--no-hooks', 'Skip git hooks installation')
	.action(initCommand);

program
	.command('add-agent <path>')
	.description('Add an agent to a module/package (e.g., packages/shared-auth)')
	.option('-n, --name <name>', 'Agent display name')
	.option('-w, --watches <patterns...>', 'Additional watch patterns')
	.action(addAgentCommand);

program
	.command('update')
	.description('Manually trigger knowledge update for all agents')
	.option('-a, --agent <path>', 'Update specific agent only')
	.option('-m, --model <model>', 'Override model for this run')
	.option('--claude', 'Use Claude Code instead of external APIs')
	.option('--dry-run', 'Show what would be updated without making changes')
	.action(updateCommand);

program
	.command('status')
	.description('Show status of all agents and pending changes')
	.action(statusCommand);

program
	.command('setup-hooks')
	.description('Install/reinstall git hooks')
	.option('-f, --force', 'Overwrite existing hooks')
	.action(setupHooksCommand);

program
	.command('scan')
	.description('Scan project and discover modules for agents')
	.option('-d, --depth <n>', 'Max directory depth to scan', '4')
	.option('-a, --all', 'Show all discovered modules (not just top 5 per type)')
	.option('--json', 'Output as JSON')
	.option('--dry-run', 'Show what would be created without creating')
	.option('--claude', 'Generate Claude Code prompt for intelligent analysis')
	.option('--setup-all', 'Automatically create agents for all discovered modules')
	.option('--teams', 'Use team templates for apps (with --setup-all)')
	.option(
		'-t, --template <template>',
		'Team template for apps: startup, standard, enterprise',
		'startup'
	)
	.option('--init-claude', 'Generate prompts for Claude Code to create rich agent descriptions')
	.action(scanCommand);

program
	.command('team [path]')
	.description('Add a full development team to a project/module')
	.option('-t, --template <template>', 'Team template: startup, standard, enterprise', 'standard')
	.option('-l, --list', 'List available team templates')
	.option('--dry-run', 'Show what would be created')
	.action(teamCommand);

program.parse();
