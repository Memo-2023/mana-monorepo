#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { addCommand } from './commands/add';
import { listCommand } from './commands/list';

const program = new Command();

program
  .name('memoro-ui')
  .description('CLI tool for copying UI components into your app (shadcn-style)')
  .version('0.1.0');

// Add command
program
  .command('add <component>')
  .description('Add a component to your project')
  .option('-y, --yes', 'Skip confirmation prompts')
  .action(addCommand);

// List command
program
  .command('list')
  .description('List all available components')
  .option('-c, --category <category>', 'Filter by category (ui, navigation)')
  .action(listCommand);

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
