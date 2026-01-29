import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	HttpCode,
	HttpStatus,
	Req,
} from '@nestjs/common';
import { DevicesService, RegisterDeviceDto } from './devices.service';
import { JwtAuthGuard, AuthenticatedRequest } from '../common/guards/jwt-auth.guard';
import { Device } from '../db/schema';
import { IsString, IsOptional } from 'class-validator';

class RegisterDeviceRequestDto {
	@IsString()
	pushToken!: string;

	@IsString()
	@IsOptional()
	tokenType?: string;

	@IsString()
	platform!: string;

	@IsString()
	@IsOptional()
	deviceName?: string;

	@IsString()
	@IsOptional()
	appId?: string;
}

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
	constructor(private readonly devicesService: DevicesService) {}

	@Get()
	async listDevices(@Req() req: AuthenticatedRequest): Promise<{ devices: Device[] }> {
		const devicesList = await this.devicesService.getByUserId(req.user.userId);
		return { devices: devicesList };
	}

	@Post('register')
	async register(
		@Req() req: AuthenticatedRequest,
		@Body() dto: RegisterDeviceRequestDto
	): Promise<{ device: Device }> {
		const device = await this.devicesService.register(req.user.userId, dto);
		return { device };
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async unregister(@Req() req: AuthenticatedRequest, @Param('id') id: string): Promise<void> {
		await this.devicesService.unregister(req.user.userId, id);
	}
}
