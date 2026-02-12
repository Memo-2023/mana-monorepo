import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { AdminModule } from '../admin/admin.module';

@Module({
	imports: [
		ConfigModule,
		HttpModule.register({
			timeout: 5000,
			maxRedirects: 3,
		}),
		AdminModule,
	],
	controllers: [MeController],
	providers: [MeService],
})
export class MeModule {}
