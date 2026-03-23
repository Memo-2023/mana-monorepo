import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BuilderModule } from './builder/builder.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			load: [configuration],
			isGlobal: true,
		}),
		BuilderModule,
	],
})
export class AppModule {}
