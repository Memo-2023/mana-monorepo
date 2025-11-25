import path from 'path';
import fs from 'fs-extra';

/**
 * Get the root directory of the memoro-ui package
 */
export function getPackageRoot(): string {
  // CLI is in packages/memoro-ui/cli/
  // Package root is packages/memoro-ui/
  return path.resolve(__dirname, '../../../');
}

/**
 * Get the path to the registry.json file
 */
export function getRegistryPath(): string {
  return path.join(getPackageRoot(), 'registry.json');
}

/**
 * Get the path to the components directory
 */
export function getComponentsPath(): string {
  return path.join(getPackageRoot(), 'components');
}

/**
 * Get the destination path for components in the target app
 */
export function getDestinationPath(cwd: string = process.cwd()): string {
  // Check if we're in an app directory with a components folder
  const possiblePaths = [
    path.join(cwd, 'components'),
    path.join(cwd, 'app', 'components'),
    path.join(cwd, 'src', 'components'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  // Default to components/ in current directory
  return path.join(cwd, 'components');
}

/**
 * Ensure a directory exists, create if not
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}
