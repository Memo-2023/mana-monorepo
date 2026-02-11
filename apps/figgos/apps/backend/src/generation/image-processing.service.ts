import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

type BgRemovalMethod = 'feathered' | 'rmbg';

@Injectable()
export class ImageProcessingService implements OnModuleInit {
	private readonly logger = new Logger(ImageProcessingService.name);
	private method: BgRemovalMethod;
	private segmenter: any = null;

	constructor(private config: ConfigService) {
		this.method = (this.config.get<string>('BG_REMOVAL_METHOD') || 'feathered') as BgRemovalMethod;
	}

	onModuleInit() {
		this.logger.log(`Background removal method: ${this.method}`);
		if (this.method === 'rmbg') {
			this.logger.log('RMBG-1.4 model will be lazy-loaded on first use');
		}
	}

	async removeBackground(pngBuffer: Buffer): Promise<Buffer> {
		if (this.method === 'rmbg') {
			return this.removeWithRmbg(pngBuffer);
		}
		return this.removeWithThreshold(pngBuffer);
	}

	/**
	 * Feathered threshold background removal (~77ms).
	 * Removes near-white pixels with a soft edge transition.
	 * T=240, feather=10. Output: WebP quality 85.
	 */
	private async removeWithThreshold(inputBuffer: Buffer): Promise<Buffer> {
		const { data, info } = await sharp(inputBuffer)
			.ensureAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		const T = 240;
		const F = 10;
		const low = T - F;

		for (let i = 0; i < data.length; i += 4) {
			const m = Math.min(data[i], data[i + 1], data[i + 2]);
			if (m > T) {
				data[i + 3] = 0;
			} else if (m > low) {
				data[i + 3] = Math.min(data[i + 3], Math.round((255 * (T - m)) / F));
			}
		}

		return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
			.webp({ quality: 85 })
			.toBuffer();
	}

	/**
	 * RMBG-1.4 AI background removal (~1s).
	 * Uses @huggingface/transformers pipeline. Model is lazy-loaded and cached.
	 */
	private async removeWithRmbg(inputBuffer: Buffer): Promise<Buffer> {
		if (!this.segmenter) {
			this.logger.log('Loading RMBG-1.4 model (first use)...');
			const { pipeline } = await import('@huggingface/transformers');
			this.segmenter = await pipeline('background-removal', 'briaai/RMBG-1.4');
			this.logger.log('RMBG-1.4 model loaded');
		}

		// HF transformers pipeline needs a file path or URL, not a buffer
		// Write to a temp file, process, then clean up
		const { writeFile, unlink } = await import('node:fs/promises');
		const { join } = await import('node:path');
		const { tmpdir } = await import('node:os');
		const { randomUUID } = await import('node:crypto');
		const tmpPath = join(tmpdir(), `figgos-rmbg-${randomUUID()}.png`);

		try {
			await writeFile(tmpPath, inputBuffer);
			const result = await this.segmenter(tmpPath);
			const img = Array.isArray(result) ? result[0] : result;
			const { data, width, height, channels } = img;
			const buf = Buffer.from(data);

			return sharp(buf, { raw: { width, height, channels } }).webp({ quality: 85 }).toBuffer();
		} finally {
			await unlink(tmpPath).catch(() => {});
		}
	}
}
