import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { UserDataController } from './user-data.controller';
import { UserDataService } from './user-data.service';
import { AdminGuard } from './guards/admin.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [
		ConfigModule,
		HttpModule.register({
			timeout: 5000,
			maxRedirects: 3,
		}),
		AuthModule,
	],
	controllers: [UserDataController],
	providers: [UserDataService, AdminGuard],
})
export class AdminModule {}
