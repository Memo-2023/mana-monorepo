import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import readline from 'readline';
import { spawn } from 'child_process';
import { LLMClient } from '../lib/llm-client.js';
import { loadConfig } from '../lib/config.js';

export async function updateCommand(options) {
	const cwd = process.cwd();
	const knowledgeDir = path.join(cwd, '.knowledge');

	console.log(chalk.blue('\n🔄 Updating Agent Knowledge...\n'));

	// Check initialization
	if (!(await fs.pathExists(knowledgeDir))) {
		console.log(chalk.red('Error: Agent Knowledge System not initialized.'));
		console.log(chalk.gray('Run: npx agent-knowledge init'));
		process.exit(1);
	}

	// Load registry
	const registryPath = path.join(knowledgeDir, 'agent-registry.yaml');
	const registry = yaml.parse(await fs.readFile(registryPath, 'utf-8'));

	if (registry.agents.length === 0) {
		console.log(chalk.yellow('No agents registered. Add agents first:'));
		console.log(chalk.gray('  npx agent-knowledge add-agent <path>'));
		return;
	}

	// Read changes
	const changesPath = path.join(knowledgeDir, 'changes.jsonl');
	const changes = await readChanges(changesPath);

	if (changes.length === 0) {
		console.log(chalk.yellow('No pending changes to process.'));
		console.log(chalk.gray('Make some commits and changes will be tracked automatically.'));
		return;
	}

	console.log(chalk.gray(`Found ${changes.length} changes to process\n`));

	// Filter agents if specific one requested
	let agents = registry.agents;
	if (options.agent) {
		agents = agents.filter((a) => a.path === options.agent || a.agent_dir.includes(options.agent));
		if (agents.length === 0) {
			console.log(chalk.red(`No agent found matching: ${options.agent}`));
			return;
		}
	}

	// Group changes by agent
	const changesByAgent = groupChangesByAgent(changes, agents);

	// If --claude mode, generate prompt file and spawn Claude Code
	if (options.claude) {
		await updateWithClaude(cwd, knowledgeDir, agents, changesByAgent, options);
		return;
	}

	// Standard LLM mode
	const config = await loadConfig(cwd);
	const llm = new LLMClient(config);

	if (options.model) {
		console.log(chalk.gray(`Using model override: ${options.model}\n`));
	}

	// Process each agent
	let totalUpdated = 0;
	for (const agent of agents) {
		const agentChanges = changesByAgent[agent.agent_dir] || [];

		if (agentChanges.length === 0) {
			console.log(chalk.gray(`⏭️  ${agent.name}: No relevant changes`));
			continue;
		}

		console.log(chalk.cyan(`\n🤖 ${agent.name} (${agentChanges.length} changes)`));

		if (options.dryRun) {
			console.log(chalk.gray('   [DRY RUN] Would update memory.md with:'));
			for (const change of agentChanges.slice(0, 5)) {
				console.log(chalk.gray(`   - ${change.file}: ${change.message.substring(0, 50)}`));
			}
			if (agentChanges.length > 5) {
				console.log(chalk.gray(`   ... and ${agentChanges.length - 5} more`));
			}
			continue;
		}

		const spinner = ora('Updating memory...').start();

		try {
			await updateAgentMemory(cwd, agent, agentChanges, llm, options.model);
			spinner.succeed(`Updated ${agent.agent_dir}/memory.md`);
			totalUpdated++;
		} catch (error) {
			spinner.fail(`Failed to update ${agent.name}: ${error.message}`);
		}
	}

	// Archive processed changes (unless dry run)
	if (!options.dryRun && totalUpdated > 0) {
		await archiveChanges(knowledgeDir);
		console.log(chalk.gray('\n📦 Changes archived'));
	}

	console.log(chalk.green(`\n✅ Updated ${totalUpdated} agent(s)\n`));
}

/**
 * Update agent memories using Claude Code
 */
async function updateWithClaude(cwd, knowledgeDir, agents, changesByAgent, options) {
	// Filter to only agents with changes
	const agentsWithChanges = agents.filter((a) => (changesByAgent[a.agent_dir] || []).length > 0);

	if (agentsWithChanges.length === 0) {
		console.log(chalk.yellow('No agents have relevant changes.'));
		return;
	}

	console.log(
		chalk.cyan(`\n📝 Generating Claude Code prompt for ${agentsWithChanges.length} agent(s)...\n`)
	);

	// Build the prompt
	let prompt = `# Agent Memory Update Task

You need to update the memory.md files for the following agents based on recent code changes.

## Instructions
For EACH agent listed below:
1. Read the agent's existing memory.md file (if it exists)
2. Analyze the changes relevant to that agent
3. Update the memory.md with new learnings:
   - Add a dated section at the TOP (under "## Recent Updates")
   - Extract: new patterns, bug fixes, breaking changes, new features, architectural decisions
   - Be concise but capture important context
   - Keep under 400 lines total
4. Write the updated content to the memory.md file

## Agents to Update

`;

	for (const agent of agentsWithChanges) {
		const agentChanges = changesByAgent[agent.agent_dir] || [];

		// Group by date
		const byDate = {};
		for (const change of agentChanges) {
			const date = change.timestamp?.split('T')[0] || 'unknown';
			byDate[date] = byDate[date] || [];
			byDate[date].push({
				file: change.file,
				message: change.message,
				author: change.author,
				status: change.status,
			});
		}

		prompt += `### ${agent.name}
- **Memory file**: \`${agent.agent_dir}/memory.md\`
- **Changes**: ${agentChanges.length} file(s) modified

\`\`\`json
${JSON.stringify(byDate, null, 2)}
\`\`\`

`;
	}

	prompt += `
## After Completion
After updating all memory.md files, provide a summary of what was updated.
`;

	// Write prompt to file
	const promptPath = path.join(knowledgeDir, 'claude-update-memory.md');
	await fs.writeFile(promptPath, prompt);
	console.log(chalk.gray(`Prompt written to: ${promptPath}\n`));

	if (options.dryRun) {
		console.log(chalk.yellow('[DRY RUN] Would run Claude Code with the above prompt.'));
		console.log(
			chalk.gray(
				`\nTo run manually:\n  cd ${cwd} && claude --dangerously-skip-permissions "Read .knowledge/claude-update-memory.md and update all agent memory files."\n`
			)
		);
		return;
	}

	// Ask user if they want to run Claude now
	const inquirer = (await import('inquirer')).default;
	const { autoRun } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'autoRun',
			message: 'Run Claude Code now to update memory files?',
			default: true,
		},
	]);

	if (autoRun) {
		console.log(chalk.cyan('\n🚀 Spawning Claude Code...\n'));

		const claudePrompt =
			'Read .knowledge/claude-update-memory.md and update all agent memory files.';

		await new Promise((resolve) => {
			const claude = spawn('claude', ['--dangerously-skip-permissions', claudePrompt], {
				cwd,
				stdio: 'inherit',
			});

			claude.on('error', (err) => {
				console.error(chalk.red(`Failed to spawn Claude Code: ${err.message}`));
				console.log(
					chalk.gray(
						`\nRun manually:\n  cd ${cwd} && claude --dangerously-skip-permissions "${claudePrompt}"\n`
					)
				);
				resolve();
			});

			claude.on('close', (code) => {
				if (code === 0) {
					console.log(chalk.green('\n✅ Claude Code completed successfully'));
					// Archive changes after successful update
					archiveChanges(knowledgeDir).then(() => {
						console.log(chalk.gray('📦 Changes archived'));
					});
				} else {
					console.log(chalk.yellow(`\nClaude Code exited with code ${code}`));
				}
				resolve();
			});
		});
	} else {
		console.log(
			chalk.gray(
				`\nRun manually when ready:\n  cd ${cwd} && claude --dangerously-skip-permissions "Read .knowledge/claude-update-memory.md and update all agent memory files."\n`
			)
		);
	}
}

async function readChanges(changesPath) {
	const changes = [];

	if (!(await fs.pathExists(changesPath))) {
		return changes;
	}

	const content = await fs.readFile(changesPath, 'utf-8');
	for (const line of content.split('\n')) {
		if (line.trim()) {
			try {
				changes.push(JSON.parse(line));
			} catch (e) {
				// Skip invalid lines
			}
		}
	}

	return changes;
}

function groupChangesByAgent(changes, agents) {
	const grouped = {};

	for (const agent of agents) {
		grouped[agent.agent_dir] = [];

		for (const change of changes) {
			const matches = agent.watches.some((pattern) => {
				const regex = new RegExp(
					'^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\//g, '\\/') + '$'
				);
				return regex.test(change.file);
			});

			if (matches) {
				grouped[agent.agent_dir].push(change);
			}
		}
	}

	return grouped;
}

async function updateAgentMemory(cwd, agent, changes, llm, modelOverride) {
	const memoryPath = path.join(cwd, agent.agent_dir, 'memory.md');
	const existingMemory = (await fs.pathExists(memoryPath))
		? await fs.readFile(memoryPath, 'utf-8')
		: '';

	// Group changes by date
	const byDate = {};
	for (const change of changes) {
		const date = change.timestamp?.split('T')[0] || 'unknown';
		byDate[date] = byDate[date] || [];
		byDate[date].push({
			file: change.file,
			message: change.message,
			author: change.author,
			status: change.status,
			diff: change.diff?.substring(0, 500),
		});
	}

	const prompt = `You are updating the memory/knowledge file for a specialized code agent called "${agent.name}".

## Existing Memory
${existingMemory || '(empty - this is a new agent)'}

## Recent Changes to Process
${JSON.stringify(byDate, null, 2)}

## Instructions
1. Analyze the changes and extract important knowledge:
   - New patterns or approaches introduced
   - Breaking changes or deprecations
   - Bug fixes and why they were needed
   - New features or capabilities
   - Architectural decisions evident from the changes

2. Update the memory file:
   - Add a new dated section at the TOP (under "## Recent Updates")
   - Be concise but capture important context
   - Keep important historical context (don't delete valuable old entries)
   - Remove redundant or outdated information
   - Keep total length reasonable (under 400 lines)

3. Format as clean markdown with clear sections

Output ONLY the updated memory.md content, no explanations or code blocks.`;

	const updatedMemory = await llm.complete(prompt, {
		model: modelOverride,
		maxTokens: 3000,
	});

	await fs.writeFile(memoryPath, updatedMemory);
}

async function archiveChanges(knowledgeDir) {
	const changesPath = path.join(knowledgeDir, 'changes.jsonl');
	const archiveDir = path.join(knowledgeDir, 'archive');

	await fs.ensureDir(archiveDir);

	const date = new Date().toISOString().split('T')[0];
	const archivePath = path.join(archiveDir, `changes-${date}.jsonl`);

	// Append to today's archive
	const content = await fs.readFile(changesPath, 'utf-8');
	await fs.appendFile(archivePath, content);

	// Clear main changes file
	await fs.writeFile(changesPath, '');
}
