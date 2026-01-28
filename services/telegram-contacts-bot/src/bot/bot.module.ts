import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { ContactsModule } from '../contacts/contacts.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [ContactsModule, UserModule],
	providers: [BotUpdate],
})
export class BotModule {}
