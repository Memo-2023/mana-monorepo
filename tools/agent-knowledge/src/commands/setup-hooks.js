import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export async function setupHooksCommand(options) {
	const cwd = process.cwd();

	console.log(chalk.blue('\n🔧 Setting up Git Hooks...\n'));

	// Check if git repo
	const gitPath = path.join(cwd, '.git');
	if (!(await fs.pathExists(gitPath))) {
		console.log(chalk.red('Error: Not a git repository'));
		process.exit(1);
	}

	// Handle worktrees: .git can be a file pointing to the actual gitdir
	let hooksDir;
	const gitStat = await fs.stat(gitPath);

	if (gitStat.isFile()) {
		// It's a worktree - read the gitdir reference
		const gitContent = await fs.readFile(gitPath, 'utf-8');
		const match = gitContent.match(/gitdir:\s*(.+)/);
		if (match) {
			const worktreeGitDir = match[1].trim();
			// For worktrees, hooks are in the common dir (main repo's .git/hooks)
			// The worktree gitdir is like: /path/to/main/.git/worktrees/branch-name
			// We need: /path/to/main/.git/hooks
			const mainGitDir = path.resolve(worktreeGitDir, '..', '..');
			hooksDir = path.join(mainGitDir, 'hooks');
			console.log(chalk.gray(`Detected worktree, using hooks from: ${hooksDir}\n`));
		} else {
			console.log(chalk.red('Error: Could not parse .git file'));
			process.exit(1);
		}
	} else {
		// Normal repo
		hooksDir = path.join(cwd, '.git', 'hooks');
	}

	const spinner = ora('Installing hooks...').start();

	try {
		await fs.ensureDir(hooksDir);

		const hookContent = `#!/bin/bash
# Agent Knowledge System - Change Tracker
# Automatically logs code changes for AI agent knowledge updates

CHANGES_FILE=".knowledge/changes.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
COMMIT_SHA=$(git rev-parse HEAD)
COMMIT_MSG=$(git log -1 --pretty=format:"%s" | sed 's/"/\\\\"/g')
AUTHOR=$(git log -1 --pretty=format:"%an")
BRANCH=$(git branch --show-current)

# Only track if .knowledge directory exists
if [ ! -d ".knowledge" ]; then
  exit 0
fi

# Get changed files and log them
git diff-tree --no-commit-id --name-status -r HEAD | while IFS=$'\\t' read -r status file; do
    # Skip if file is empty
    [ -z "$file" ] && continue

    # Determine module from path (first two path segments)
    MODULE=$(echo "$file" | cut -d'/' -f1-2)

    # Get truncated diff for context (max 2000 chars)
    DIFF=$(git show HEAD -- "$file" 2>/dev/null | head -50 | sed 's/"/\\\\"/g' | tr '\\n' ' ' | cut -c1-2000)

    # Create JSON entry and append
    echo "{\\"timestamp\\":\\"$TIMESTAMP\\",\\"commit\\":\\"$COMMIT_SHA\\",\\"message\\":\\"$COMMIT_MSG\\",\\"author\\":\\"$AUTHOR\\",\\"branch\\":\\"$BRANCH\\",\\"module\\":\\"$MODULE\\",\\"file\\":\\"$file\\",\\"status\\":\\"$status\\",\\"diff\\":\\"$DIFF\\"}" >> "$CHANGES_FILE"
done

# Notify user
CHANGE_COUNT=$(git diff-tree --no-commit-id --name-only -r HEAD | wc -l | tr -d ' ')
if [ "$CHANGE_COUNT" -gt 0 ]; then
    echo "📝 Tracked $CHANGE_COUNT file(s) for agent knowledge"
fi
`;

		const hookPath = path.join(hooksDir, 'post-commit');

		// Check if hook already exists
		if (await fs.pathExists(hookPath)) {
			const existing = await fs.readFile(hookPath, 'utf-8');

			if (existing.includes('Agent Knowledge System')) {
				if (options.force) {
					// Replace the AKS section
					const beforeAKS = existing.split('# Agent Knowledge System')[0];
					await fs.writeFile(hookPath, beforeAKS.trim() + '\n\n' + hookContent);
					spinner.succeed('Replaced existing Agent Knowledge System hook');
				} else {
					spinner.info('Hook already installed. Use --force to reinstall.');
					return;
				}
			} else {
				// Append to existing hook
				await fs.appendFile(hookPath, '\n\n' + hookContent);
				spinner.succeed('Appended to existing post-commit hook');
			}
		} else {
			await fs.writeFile(hookPath, hookContent);
			spinner.succeed('Created post-commit hook');
		}

		// Make executable
		await fs.chmod(hookPath, '755');

		console.log(chalk.green('\n✅ Git hooks installed successfully!\n'));
		console.log(chalk.gray('Changes will now be tracked automatically on each commit.'));
	} catch (error) {
		spinner.fail('Failed to install hooks');
		console.error(chalk.red(error.message));
		process.exit(1);
	}
}
