import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
	@Get()
	@ApiOperation({
		summary: 'Health check',
		description: 'Returns service health status. No authentication required.',
	})
	@ApiResponse({
		status: 200,
		description: 'Service is healthy',
		schema: {
			type: 'object',
			properties: {
				status: { type: 'string', example: 'ok' },
				service: { type: 'string', example: 'api-gateway' },
				timestamp: { type: 'string', example: '2025-01-29T10:30:00.000Z' },
			},
		},
	})
	check() {
		return {
			status: 'ok',
			service: 'api-gateway',
			timestamp: new Date().toISOString(),
		};
	}
}
