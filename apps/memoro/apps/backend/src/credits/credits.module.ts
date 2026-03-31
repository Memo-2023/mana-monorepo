import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { CreditClientService } from './credit-client.service';
import { CreditController } from './credit.controller';
import { CreditConsumptionService } from './credit-consumption.service';

@Module({
	imports: [ConfigModule, AuthModule],
	controllers: [CreditController],
	providers: [CreditClientService, CreditConsumptionService],
	exports: [CreditClientService, CreditConsumptionService],
})
export class CreditsModule {}
