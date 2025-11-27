import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';
import { getComponent, resolveDependencies } from '../utils/registry';
import { copyComponent, componentExists } from '../utils/files';
import { getDestinationPath } from '../utils/paths';

export async function addCommand(componentKey: string, options: { yes?: boolean }) {
	const spinner = ora();

	try {
		// Load component info
		spinner.start('Loading component info...');
		const item = await getComponent(componentKey);

		if (!item) {
			spinner.fail(chalk.red(`Component "${componentKey}" not found`));
			console.log(chalk.dim('\nRun `memoro-ui list` to see available components'));
			process.exit(1);
		}

		const { component, category } = item;
		spinner.succeed(`Found component: ${chalk.cyan(component.name)}`);

		// Get destination path
		const destination = getDestinationPath();
		console.log(chalk.dim(`Destination: ${destination}`));

		// Check if component already exists
		const exists = await componentExists(component, category, destination);
		if (exists && !options.yes) {
			const { overwrite } = await prompts({
				type: 'confirm',
				name: 'overwrite',
				message: `Component ${component.name} already exists. Overwrite?`,
				initial: false,
			});

			if (!overwrite) {
				console.log(chalk.yellow('Cancelled'));
				process.exit(0);
			}
		}

		// Resolve dependencies
		spinner.start('Resolving dependencies...');
		const dependencies = await resolveDependencies(componentKey);
		spinner.succeed(
			dependencies.length > 0
				? `Dependencies: ${chalk.cyan(dependencies.join(', '))}`
				: 'No dependencies'
		);

		// Ask to install dependencies
		const componentsToInstall = [componentKey, ...dependencies];
		const newComponents = [];

		for (const dep of dependencies) {
			const depItem = await getComponent(dep);
			if (depItem) {
				const depExists = await componentExists(depItem.component, depItem.category, destination);
				if (!depExists) {
					newComponents.push(dep);
				}
			}
		}

		if (newComponents.length > 0 && !options.yes) {
			console.log(
				chalk.yellow(`\nThe following dependencies will also be installed:\n`) +
					newComponents.map((c) => `  - ${c}`).join('\n')
			);

			const { installDeps } = await prompts({
				type: 'confirm',
				name: 'installDeps',
				message: 'Install dependencies?',
				initial: true,
			});

			if (!installDeps) {
				console.log(chalk.yellow('Cancelled'));
				process.exit(0);
			}
		}

		// Copy dependencies first
		for (const dep of dependencies) {
			const depItem = await getComponent(dep);
			if (!depItem) continue;

			const depExists = await componentExists(depItem.component, depItem.category, destination);
			if (depExists) {
				console.log(chalk.dim(`  ✓ ${depItem.component.name} (already exists)`));
				continue;
			}

			spinner.start(`Installing dependency: ${depItem.component.name}...`);
			await copyComponent(depItem.component, depItem.category, destination);
			spinner.succeed(`Installed ${chalk.green(depItem.component.name)}`);
		}

		// Copy main component
		spinner.start(`Installing ${component.name}...`);
		const copiedFiles = await copyComponent(component, category, destination);
		spinner.succeed(`Installed ${chalk.green(component.name)}`);

		// Show success message
		console.log(chalk.green('\n✅ Success!\n'));
		console.log(`${chalk.bold('Files added:')}`);
		copiedFiles.forEach((file) => {
			const relativePath = file.replace(process.cwd() + '/', '');
			console.log(chalk.dim(`  ${relativePath}`));
		});

		console.log(`\n${chalk.bold('Import:')}`);
		console.log(
			chalk.cyan(
				`  import { ${component.name} } from '@/components/${category}/${component.name}';`
			)
		);

		console.log(`\n${chalk.bold('Usage:')}`);
		console.log(chalk.dim(`  See components/${category}/${component.name}/README.md for examples`));
	} catch (error) {
		spinner.fail(chalk.red('Failed to add component'));
		console.error(error);
		process.exit(1);
	}
}
