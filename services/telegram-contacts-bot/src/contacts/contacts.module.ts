import { Module } from '@nestjs/common';
import { ContactsClient } from './contacts.client';

@Module({
	providers: [ContactsClient],
	exports: [ContactsClient],
})
export class ContactsModule {}
