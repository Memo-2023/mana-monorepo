import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export async function statusCommand() {
	const cwd = process.cwd();
	const knowledgeDir = path.join(cwd, '.knowledge');

	console.log(chalk.blue('\n📊 Agent Knowledge System Status\n'));

	// Check initialization
	if (!(await fs.pathExists(knowledgeDir))) {
		console.log(chalk.red('❌ Not initialized'));
		console.log(chalk.gray('Run: npx agent-knowledge init'));
		return;
	}

	console.log(chalk.green('✓ Initialized\n'));

	// Load config
	const configPath = path.join(knowledgeDir, 'config.yaml');
	if (await fs.pathExists(configPath)) {
		const config = yaml.parse(await fs.readFile(configPath, 'utf-8'));
		console.log(chalk.cyan('Configuration:'));
		console.log(chalk.gray(`  Provider: ${config.provider}`));
		console.log(chalk.gray(`  Model: ${config.model}`));
		console.log('');
	}

	// Load registry
	const registryPath = path.join(knowledgeDir, 'agent-registry.yaml');
	const registry = yaml.parse(await fs.readFile(registryPath, 'utf-8'));

	console.log(chalk.cyan(`Registered Agents (${registry.agents.length}):`));

	if (registry.agents.length === 0) {
		console.log(chalk.gray('  No agents registered'));
		console.log(chalk.gray('  Add one with: npx agent-knowledge add-agent <path>'));
	} else {
		for (const agent of registry.agents) {
			const agentDir = path.join(cwd, agent.agent_dir);
			const memoryPath = path.join(agentDir, 'memory.md');

			let status = '✓';
			let memoryInfo = '';

			if (!(await fs.pathExists(agentDir))) {
				status = '❌';
				memoryInfo = chalk.red('(missing)');
			} else if (await fs.pathExists(memoryPath)) {
				const stats = await fs.stat(memoryPath);
				const lastUpdate = stats.mtime.toLocaleDateString();
				memoryInfo = chalk.gray(`(updated: ${lastUpdate})`);
			} else {
				memoryInfo = chalk.yellow('(no memory yet)');
			}

			console.log(`  ${status} ${chalk.white(agent.name)}`);
			console.log(`    ${chalk.gray('Path:')} ${agent.path}`);
			console.log(`    ${chalk.gray('Memory:')} ${memoryInfo}`);
			console.log(`    ${chalk.gray('Watches:')} ${agent.watches.length} patterns`);
		}
	}

	// Check pending changes
	console.log('');
	const changesPath = path.join(knowledgeDir, 'changes.jsonl');
	let pendingChanges = 0;

	if (await fs.pathExists(changesPath)) {
		const content = await fs.readFile(changesPath, 'utf-8');
		pendingChanges = content.split('\n').filter((line) => line.trim()).length;
	}

	console.log(chalk.cyan('Pending Changes:'));
	if (pendingChanges === 0) {
		console.log(chalk.gray('  No pending changes'));
	} else {
		console.log(chalk.yellow(`  ${pendingChanges} changes waiting to be processed`));
		console.log(chalk.gray('  Run: npx agent-knowledge update'));
	}

	// Check git hooks (handle worktrees)
	console.log('');
	console.log(chalk.cyan('Git Hooks:'));

	let hookPath;
	const gitPath = path.join(cwd, '.git');
	const gitStat = await fs.stat(gitPath).catch(() => null);

	if (gitStat?.isFile()) {
		// It's a worktree - parse gitdir reference
		const gitContent = await fs.readFile(gitPath, 'utf-8');
		const match = gitContent.match(/gitdir:\s*(.+)/);
		if (match) {
			const worktreeGitDir = match[1].trim();
			// Hooks are in the main repo's .git/hooks
			const mainGitDir = path.resolve(worktreeGitDir, '..', '..');
			hookPath = path.join(mainGitDir, 'hooks', 'post-commit');
		}
	} else {
		hookPath = path.join(cwd, '.git', 'hooks', 'post-commit');
	}

	if (hookPath && (await fs.pathExists(hookPath))) {
		const hookContent = await fs.readFile(hookPath, 'utf-8');
		if (hookContent.includes('Agent Knowledge System')) {
			console.log(chalk.green('  ✓ post-commit hook installed'));
		} else {
			console.log(chalk.yellow('  ⚠ post-commit hook exists but missing AKS integration'));
			console.log(chalk.gray('  Run: npx agent-knowledge setup-hooks'));
		}
	} else {
		console.log(chalk.yellow('  ⚠ post-commit hook not installed'));
		console.log(chalk.gray('  Run: npx agent-knowledge setup-hooks'));
	}

	// Archive stats
	console.log('');
	const archiveDir = path.join(knowledgeDir, 'archive');
	if (await fs.pathExists(archiveDir)) {
		const archives = await fs.readdir(archiveDir);
		if (archives.length > 0) {
			console.log(chalk.cyan('Archive:'));
			console.log(chalk.gray(`  ${archives.length} archived change files`));
		}
	}

	console.log('');
}
