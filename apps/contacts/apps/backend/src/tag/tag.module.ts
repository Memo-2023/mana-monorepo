import { Module } from '@nestjs/common';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';
import { ContactModule } from '../contact/contact.module';

@Module({
	imports: [ContactModule],
	controllers: [TagController],
	providers: [TagService],
	exports: [TagService],
})
export class TagModule {}
