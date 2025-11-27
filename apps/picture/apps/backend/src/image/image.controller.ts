import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ImageService } from './image.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../common/decorators/current-user.decorator';
import { GetImagesQueryDto, ToggleFavoriteDto } from './dto/image.dto';

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Get()
  async getImages(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetImagesQueryDto,
  ) {
    return this.imageService.getImages(user.userId, query);
  }

  @Get(':id')
  async getImageById(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.getImageById(id, user.userId);
  }

  @Patch(':id/archive')
  async archiveImage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.archiveImage(id, user.userId);
  }

  @Patch(':id/unarchive')
  async unarchiveImage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.unarchiveImage(id, user.userId);
  }

  @Delete(':id')
  async deleteImage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.deleteImage(id, user.userId);
  }

  @Patch(':id/publish')
  async publishImage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.publishImage(id, user.userId);
  }

  @Patch(':id/unpublish')
  async unpublishImage(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    return this.imageService.unpublishImage(id, user.userId);
  }

  @Patch(':id/favorite')
  async toggleFavorite(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: ToggleFavoriteDto,
  ) {
    return this.imageService.toggleFavorite(id, user.userId, dto.isFavorite);
  }
}
