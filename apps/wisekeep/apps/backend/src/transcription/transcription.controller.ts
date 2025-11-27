import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { TranscribeRequestDto } from './dto/transcribe-request.dto';

@Controller('transcription')
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post()
  async createJob(@Body() dto: TranscribeRequestDto) {
    return this.transcriptionService.createJob(dto);
  }

  @Get()
  async getAllJobs() {
    return this.transcriptionService.getAllJobs();
  }

  @Get('stats')
  async getStats() {
    return this.transcriptionService.getStats();
  }

  @Get(':id')
  async getJob(@Param('id') id: string) {
    return this.transcriptionService.getJob(id);
  }

  @Delete(':id')
  async cancelJob(@Param('id') id: string) {
    return this.transcriptionService.cancelJob(id);
  }
}
