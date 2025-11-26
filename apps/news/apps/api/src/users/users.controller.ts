import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@manacore/news-database';
import { IsOptional, IsString, IsArray, IsEnum, IsBoolean } from 'class-validator';

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  preferredCategories?: string[];

  @IsOptional()
  @IsArray()
  blockedSources?: string[];

  @IsOptional()
  @IsEnum(['slow', 'normal', 'fast'])
  readingSpeed?: 'slow' | 'normal' | 'fast';

  @IsOptional()
  @IsString()
  notificationSettings?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser() user: User) {
    return this.usersService.getUserById(user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  async updateCurrentUser(
    @CurrentUser() user: User,
    @Body() body: UpdateUserDto,
  ) {
    return this.usersService.updateUser(user.id, body);
  }

  @Patch('me/onboarding')
  @UseGuards(AuthGuard)
  async completeOnboarding(@CurrentUser() user: User) {
    await this.usersService.completeOnboarding(user.id);
    return { success: true };
  }
}
