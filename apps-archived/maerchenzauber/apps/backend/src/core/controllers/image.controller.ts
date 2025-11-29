import { Controller, Get } from '@nestjs/common';

@Controller('image')
export class ImageController {
	constructor() {}

	@Get('test-replicate')
	async testReplicate() {
		// const res = await this.imageService.testReplicate("Cat flying in the sky");c
		const res = Promise.resolve('Cat flying in the sky');
		console.log(res);
		return res;
	}
}
