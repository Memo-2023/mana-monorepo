#!/usr/bin/env node
/**
 * Agent Knowledge Update Script
 *
 * This script is designed to be run via cron job or CI to update agent memories.
 * Can also be run manually: node scripts/agents/update-agents.js
 *
 * Usage:
 *   node scripts/agents/update-agents.js           # Update all agents
 *   node scripts/agents/update-agents.js --dry-run # Preview changes
 *   node scripts/agents/update-agents.js --agent packages/auth  # Specific agent
 *
 * Cron example (3 AM daily):
 *   0 3 * * * cd /path/to/project && node scripts/agents/update-agents.js >> .knowledge/cron.log 2>&1
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Configuration
const KNOWLEDGE_DIR = path.join(PROJECT_ROOT, '.knowledge');
const CHANGES_FILE = path.join(KNOWLEDGE_DIR, 'changes.jsonl');
const REGISTRY_FILE = path.join(KNOWLEDGE_DIR, 'agent-registry.yaml');
const CONFIG_FILE = path.join(KNOWLEDGE_DIR, 'config.yaml');
const ENV_FILE = path.join(KNOWLEDGE_DIR, '.env');

async function main() {
	console.log('🌙 Agent Knowledge Update Script');
	console.log(`   Project: ${PROJECT_ROOT}`);
	console.log(`   Time: ${new Date().toISOString()}\n`);

	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const agentFilter = args.find((a) => a.startsWith('--agent='))?.split('=')[1];

	// Load config
	const config = await loadConfig();
	console.log(`   Provider: ${config.provider}`);
	console.log(`   Model: ${config.model}\n`);

	// Load registry
	const registry = await loadYaml(REGISTRY_FILE);
	let agents = registry.agents || [];

	if (agentFilter) {
		agents = agents.filter((a) => a.path.includes(agentFilter));
		console.log(`   Filtering to agent: ${agentFilter}`);
	}

	if (agents.length === 0) {
		console.log('No agents to update.');
		return;
	}

	// Read changes
	const changes = await readChanges();
	if (changes.length === 0) {
		console.log('No pending changes to process.');
		return;
	}

	console.log(`📊 Processing ${changes.length} changes for ${agents.length} agent(s)...\n`);

	// Group changes by agent
	const changesByAgent = groupChangesByAgent(changes, agents);

	// Update each agent
	let updated = 0;
	for (const agent of agents) {
		const agentChanges = changesByAgent[agent.agent_dir] || [];
		if (agentChanges.length === 0) {
			console.log(`⏭️  ${agent.name}: No relevant changes`);
			continue;
		}

		console.log(`🤖 ${agent.name}: ${agentChanges.length} changes`);

		if (dryRun) {
			console.log('   [DRY RUN] Would update memory');
			continue;
		}

		try {
			await updateAgentMemory(agent, agentChanges, config);
			console.log(`   ✓ Updated memory.md`);
			updated++;
		} catch (error) {
			console.error(`   ✗ Error: ${error.message}`);
		}
	}

	// Archive changes
	if (!dryRun && updated > 0) {
		await archiveChanges();
		console.log('\n📦 Changes archived');
	}

	console.log(`\n✅ Updated ${updated} agent(s)`);
}

async function loadConfig() {
	const config = {
		provider: process.env.LLM_PROVIDER || 'openrouter',
		model: process.env.OPENROUTER_MODEL || process.env.ANTHROPIC_MODEL || 'google/gemini-flash-1.5',
		openrouterApiKey: process.env.OPENROUTER_API_KEY,
		anthropicApiKey: process.env.ANTHROPIC_API_KEY,
	};

	// Load from .env file
	try {
		const envContent = await fs.readFile(ENV_FILE, 'utf-8');
		for (const line of envContent.split('\n')) {
			const [key, ...valueParts] = line.split('=');
			if (key && valueParts.length > 0) {
				const value = valueParts.join('=').trim();
				if (key.trim() === 'OPENROUTER_API_KEY') config.openrouterApiKey = value;
				if (key.trim() === 'ANTHROPIC_API_KEY') config.anthropicApiKey = value;
				if (key.trim() === 'LLM_PROVIDER') config.provider = value;
				if (key.trim() === 'OPENROUTER_MODEL') config.model = value;
			}
		}
	} catch (e) {
		// .env file not found, use defaults
	}

	// Load from config.yaml
	try {
		const yamlConfig = await loadYaml(CONFIG_FILE);
		if (yamlConfig.provider) config.provider = yamlConfig.provider;
		if (yamlConfig.model) config.model = yamlConfig.model;
	} catch (e) {
		// config.yaml not found
	}

	return config;
}

async function loadYaml(filePath) {
	const content = await fs.readFile(filePath, 'utf-8');
	// Simple YAML parser for our use case
	const result = { agents: [] };
	let currentAgent = null;

	for (const line of content.split('\n')) {
		if (line.trim().startsWith('- path:')) {
			if (currentAgent) result.agents.push(currentAgent);
			currentAgent = { path: line.split(':')[1].trim(), watches: [] };
		} else if (currentAgent) {
			if (line.includes('agent_dir:')) currentAgent.agent_dir = line.split(':')[1].trim();
			if (line.includes('name:')) currentAgent.name = line.split(':').slice(1).join(':').trim();
			if (line.trim().startsWith('- ') && !line.includes(':')) {
				currentAgent.watches.push(line.trim().slice(2));
			}
		}
	}
	if (currentAgent) result.agents.push(currentAgent);

	return result;
}

async function readChanges() {
	try {
		const content = await fs.readFile(CHANGES_FILE, 'utf-8');
		return content
			.split('\n')
			.filter((line) => line.trim())
			.map((line) => {
				try {
					return JSON.parse(line);
				} catch {
					return null;
				}
			})
			.filter(Boolean);
	} catch {
		return [];
	}
}

function groupChangesByAgent(changes, agents) {
	const grouped = {};
	for (const agent of agents) {
		grouped[agent.agent_dir] = changes.filter((change) =>
			agent.watches.some((pattern) => {
				const regex = new RegExp('^' + pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
				return regex.test(change.file);
			})
		);
	}
	return grouped;
}

async function updateAgentMemory(agent, changes, config) {
	const memoryPath = path.join(PROJECT_ROOT, agent.agent_dir, 'memory.md');
	let existingMemory = '';
	try {
		existingMemory = await fs.readFile(memoryPath, 'utf-8');
	} catch {
		/* new file */
	}

	const byDate = {};
	for (const c of changes) {
		const date = c.timestamp?.split('T')[0] || 'unknown';
		byDate[date] = byDate[date] || [];
		byDate[date].push({ file: c.file, message: c.message, author: c.author });
	}

	const prompt = `You are updating the memory file for "${agent.name}".

## Existing Memory
${existingMemory || '(empty)'}

## Recent Changes
${JSON.stringify(byDate, null, 2)}

## Instructions
Update the memory file:
- Add dated section at TOP for new learnings
- Be concise, capture important context
- Keep under 400 lines

Output ONLY the updated memory.md content.`;

	const updatedMemory = await callLLM(prompt, config);
	await fs.writeFile(memoryPath, updatedMemory);
}

async function callLLM(prompt, config) {
	if (config.provider === 'openrouter') {
		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${config.openrouterApiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: config.model,
				messages: [{ role: 'user', content: prompt }],
				max_tokens: 3000,
			}),
		});
		const data = await response.json();
		return data.choices[0].message.content;
	} else {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': config.anthropicApiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model: config.model,
				max_tokens: 3000,
				messages: [{ role: 'user', content: prompt }],
			}),
		});
		const data = await response.json();
		return data.content[0].text;
	}
}

async function archiveChanges() {
	const archiveDir = path.join(KNOWLEDGE_DIR, 'archive');
	await fs.mkdir(archiveDir, { recursive: true });

	const date = new Date().toISOString().split('T')[0];
	const archivePath = path.join(archiveDir, `changes-${date}.jsonl`);

	const content = await fs.readFile(CHANGES_FILE, 'utf-8');
	await fs.appendFile(archivePath, content);
	await fs.writeFile(CHANGES_FILE, '');
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
