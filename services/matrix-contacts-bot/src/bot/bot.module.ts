import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ContactsModule } from '../contacts/contacts.module';
import { SessionModule } from '@manacore/bot-services';

@Module({
	imports: [ContactsModule, SessionModule.forRoot()],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
