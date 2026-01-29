import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './types';

/**
 * File-based JSON storage provider
 * Used for local GDPR-compliant data storage
 */
export class FileStorageProvider<T> implements StorageProvider<T> {
	private readonly logger = new Logger(FileStorageProvider.name);
	private readonly filePath: string;
	private readonly defaultData: T;

	constructor(filePath: string, defaultData: T) {
		this.filePath = filePath;
		this.defaultData = defaultData;
	}

	async load(): Promise<T> {
		try {
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (fs.existsSync(this.filePath)) {
				const content = fs.readFileSync(this.filePath, 'utf-8');
				return JSON.parse(content);
			} else {
				await this.save(this.defaultData);
				return this.defaultData;
			}
		} catch (error) {
			this.logger.error(`Failed to load data from ${this.filePath}:`, error);
			return this.defaultData;
		}
	}

	async save(data: T): Promise<void> {
		try {
			const dir = path.dirname(this.filePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
		} catch (error) {
			this.logger.error(`Failed to save data to ${this.filePath}:`, error);
			throw error;
		}
	}
}

/**
 * In-memory storage provider (for testing)
 */
export class MemoryStorageProvider<T> implements StorageProvider<T> {
	private data: T;

	constructor(defaultData: T) {
		this.data = defaultData;
	}

	async load(): Promise<T> {
		return this.data;
	}

	async save(data: T): Promise<void> {
		this.data = data;
	}
}
