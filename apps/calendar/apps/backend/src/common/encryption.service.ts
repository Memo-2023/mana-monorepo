import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

@Injectable()
export class EncryptionService {
	private readonly algorithm = 'aes-256-gcm';
	private readonly key: Buffer;

	constructor(private readonly configService: ConfigService) {
		const secret = this.configService.get<string>(
			'ENCRYPTION_KEY',
			'calendar-dev-encryption-key-change-in-prod'
		);
		this.key = scryptSync(secret, 'salt', 32);
	}

	encrypt(text: string): string {
		const iv = randomBytes(16);
		const cipher = createCipheriv(this.algorithm, this.key, iv);
		const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
		const authTag = cipher.getAuthTag();
		// Format: iv:authTag:encrypted (all base64)
		return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
	}

	decrypt(encryptedText: string): string {
		const [ivBase64, authTagBase64, dataBase64] = encryptedText.split(':');
		if (!ivBase64 || !authTagBase64 || !dataBase64) {
			throw new Error('Invalid encrypted text format');
		}
		const iv = Buffer.from(ivBase64, 'base64');
		const authTag = Buffer.from(authTagBase64, 'base64');
		const encrypted = Buffer.from(dataBase64, 'base64');
		const decipher = createDecipheriv(this.algorithm, this.key, iv);
		decipher.setAuthTag(authTag);
		return decipher.update(encrypted) + decipher.final('utf8');
	}
}
