import chalk from 'chalk';
import { getAllComponents } from '../utils/registry';
import { componentExists } from '../utils/files';
import { getDestinationPath } from '../utils/paths';

export async function listCommand(options: { category?: string }) {
  try {
    const components = await getAllComponents();
    const destination = getDestinationPath();

    // Filter by category if specified
    const filtered = options.category
      ? components.filter(c => c.category === options.category)
      : components;

    if (filtered.length === 0) {
      console.log(chalk.yellow('No components found'));
      return;
    }

    // Group by category
    const grouped = filtered.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, typeof filtered>);

    console.log(chalk.bold.cyan('\n📦 Available Components\n'));

    for (const [category, items] of Object.entries(grouped)) {
      console.log(chalk.bold(`${category.toUpperCase()}:`));

      for (const { key, component } of items) {
        const exists = await componentExists(component, category, destination);
        const status = exists ? chalk.green('✓') : chalk.dim('○');
        const name = exists ? chalk.green(key) : chalk.white(key);
        const desc = chalk.dim(component.description);

        console.log(`  ${status} ${name}`);
        console.log(`    ${desc}`);

        if (component.dependencies.length > 0) {
          console.log(
            chalk.dim(`    Dependencies: ${component.dependencies.join(', ')}`)
          );
        }
      }

      console.log('');
    }

    console.log(chalk.dim('Legend:'));
    console.log(chalk.dim(`  ${chalk.green('✓')} = Installed in this project`));
    console.log(chalk.dim(`  ${chalk.dim('○')} = Not installed`));
    console.log('');
    console.log(chalk.dim(`Run ${chalk.cyan('memoro-ui add <component>')} to install a component`));
  } catch (error) {
    console.error(chalk.red('Failed to list components:'), error);
    process.exit(1);
  }
}
