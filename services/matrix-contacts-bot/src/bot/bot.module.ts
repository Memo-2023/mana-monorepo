import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { ContactsModule } from '../contacts/contacts.module';
import { SessionModule } from '../session/session.module';

@Module({
	imports: [ContactsModule, SessionModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
