import { Controller, Get, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { ImageSupabaseService } from './core/services/image-supabase.service';

@Controller()
export class AppController {
	constructor(
		private readonly appService: AppService,
		private readonly imageService: ImageSupabaseService
	) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@Post('test-imagen')
	async testImagen(@Body('prompt') prompt: string, @Res() res: Response) {
		try {
			const result = await this.imageService.generateImage(
				prompt || 'a dog reading a newspaper',
				'test'
			);

			if (result.error) {
				console.error('Image generation error:', result.error);
				return res.status(500).json({ error: result.error.message || 'Failed to generate image' });
			}

			if (!result.data) {
				return res.status(500).json({ error: 'No image data received' });
			}

			return res.status(200).json({ imageUrl: result.data });
		} catch (error) {
			console.error('Unexpected error:', error);
			return res.status(500).json({
				error: error instanceof Error ? error.message : 'Failed to generate image',
			});
		}
	}

	@Post('test-seedream')
	async testSeedream(
		@Body('prompt') prompt: string,
		@Body('characterImageUrl') characterImageUrl: string | undefined,
		@Body('type') type: 'character' | 'story' = 'story',
		@Res() res: Response
	) {
		try {
			console.log('Testing Seedream-4 with:');
			console.log('  - Prompt:', prompt);
			console.log('  - Type:', type);
			console.log('  - Character Image:', characterImageUrl || 'none');

			// Create signed URL if character image provided
			let signedUrl: string | undefined;
			if (characterImageUrl) {
				const signedResult =
					await this.imageService.createSignedUrlForCharacterImage(characterImageUrl);
				if (signedResult.error) {
					console.error('Failed to create signed URL:', signedResult.error);
				} else {
					signedUrl = signedResult.data!;
					console.log('  - Signed URL created successfully');
				}
			}

			// Generate image with appropriate path (determines aspect ratio)
			const path = type === 'character' ? 'test/characters' : 'test/stories';
			const result = await this.imageService.generateImage(
				prompt || 'a friendly dragon in a magical forest',
				path,
				undefined,
				undefined,
				signedUrl
			);

			if (result.error) {
				console.error('Image generation error:', result.error);
				return res.status(500).json({ error: result.error.message || 'Failed to generate image' });
			}

			if (!result.data) {
				return res.status(500).json({ error: 'No image data received' });
			}

			return res.status(200).json({
				imageUrl: result.data,
				aspectRatio: type === 'character' ? '1:1' : '3:4',
				usedCharacterImage: !!signedUrl,
			});
		} catch (error) {
			console.error('Unexpected error:', error);
			return res.status(500).json({
				error: error instanceof Error ? error.message : 'Failed to generate image',
			});
		}
	}
}
