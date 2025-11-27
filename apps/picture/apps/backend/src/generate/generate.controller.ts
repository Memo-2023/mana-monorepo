import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GenerateService } from './generate.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';
import { GenerateImageDto } from './dto/generate.dto';

@Controller('generate')
export class GenerateController {
  constructor(private readonly generateService: GenerateService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async generateImage(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: GenerateImageDto,
  ) {
    return this.generateService.generateImage(user.userId, dto);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async checkStatus(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.generateService.checkStatus(id, user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async cancelGeneration(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.generateService.cancelGeneration(id, user.userId);
  }

  // Webhook endpoint for Replicate - no auth required
  @Post('webhook')
  async handleWebhook(@Body() body: any) {
    return this.generateService.handleWebhook(body);
  }
}
