import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ListService } from './list.service';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

class CreateListDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

class UpdateListDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  quoteIds?: string[];
}

class AddQuoteDto {
  @IsString()
  @IsNotEmpty()
  quoteId!: string;
}

// Simple JWT extraction - in production, use proper auth middleware
function extractUserId(authHeader?: string): string {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header');
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return payload.sub;
  } catch {
    throw new UnauthorizedException('Invalid token');
  }
}

@Controller('lists')
export class ListController {
  constructor(private readonly listService: ListService) {}

  @Get()
  async findAll(@Headers('authorization') authHeader: string) {
    const userId = extractUserId(authHeader);
    const lists = await this.listService.findByUserId(userId);
    return { lists };
  }

  @Get(':id')
  async findOne(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader);
    const list = await this.listService.findById(userId, id);
    return { list };
  }

  @Post()
  async create(
    @Headers('authorization') authHeader: string,
    @Body() dto: CreateListDto,
  ) {
    const userId = extractUserId(authHeader);
    const list = await this.listService.create({
      userId,
      name: dto.name,
      description: dto.description,
    });
    return { list };
  }

  @Put(':id')
  async update(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
  ) {
    const userId = extractUserId(authHeader);
    const list = await this.listService.update(userId, id, dto);
    return { list };
  }

  @Delete(':id')
  async delete(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const userId = extractUserId(authHeader);
    await this.listService.delete(userId, id);
    return { success: true };
  }

  @Post(':id/quotes')
  async addQuote(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() dto: AddQuoteDto,
  ) {
    const userId = extractUserId(authHeader);
    const list = await this.listService.addQuoteToList(userId, id, dto.quoteId);
    return { list };
  }

  @Delete(':id/quotes/:quoteId')
  async removeQuote(
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Param('quoteId') quoteId: string,
  ) {
    const userId = extractUserId(authHeader);
    const list = await this.listService.removeQuoteFromList(userId, id, quoteId);
    return { list };
  }
}
