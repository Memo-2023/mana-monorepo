import fs from 'fs-extra';
import path from 'path';
import { ComponentInfo } from '../types';
import { getComponentsPath, ensureDir } from './paths';

/**
 * Copy a component's files to the destination
 */
export async function copyComponent(
  component: ComponentInfo,
  category: string,
  destinationBase: string
): Promise<string[]> {
  const sourcePath = path.join(getComponentsPath(), category, component.name);
  const destPath = path.join(destinationBase, category, component.name);

  // Ensure destination directory exists
  await ensureDir(destPath);

  const copiedFiles: string[] = [];

  // Copy each file
  for (const file of component.files) {
    const sourceFile = path.join(sourcePath, file);
    const destFile = path.join(destPath, file);

    if (!await fs.pathExists(sourceFile)) {
      throw new Error(`Source file not found: ${sourceFile}`);
    }

    await fs.copy(sourceFile, destFile, { overwrite: true });
    copiedFiles.push(destFile);
  }

  // Also copy index.ts if it exists
  const indexFile = path.join(sourcePath, 'index.ts');
  if (await fs.pathExists(indexFile)) {
    const destIndex = path.join(destPath, 'index.ts');
    await fs.copy(indexFile, destIndex, { overwrite: true });
    copiedFiles.push(destIndex);
  }

  return copiedFiles;
}

/**
 * Check if a component already exists at the destination
 */
export async function componentExists(
  component: ComponentInfo,
  category: string,
  destinationBase: string
): Promise<boolean> {
  const destPath = path.join(destinationBase, category, component.name);
  return await fs.pathExists(destPath);
}

/**
 * Get the list of files that would be copied
 */
export function getComponentFiles(
  component: ComponentInfo,
  category: string,
  destinationBase: string
): string[] {
  const destPath = path.join(destinationBase, category, component.name);
  const files = component.files.map(file => path.join(destPath, file));

  // Add index.ts
  files.push(path.join(destPath, 'index.ts'));

  return files;
}
