import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { QuotesModule } from '../quotes/quotes.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [QuotesModule, UserModule],
	providers: [BotUpdate],
})
export class BotModule {}
