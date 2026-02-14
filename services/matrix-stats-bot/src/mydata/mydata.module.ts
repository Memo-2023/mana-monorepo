import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MyDataService } from './mydata.service';

@Module({
	imports: [ConfigModule],
	providers: [MyDataService],
	exports: [MyDataService],
})
export class MyDataModule {}
