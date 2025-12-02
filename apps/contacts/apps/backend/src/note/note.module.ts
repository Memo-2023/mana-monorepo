import { Module } from '@nestjs/common';
import { ContactNoteController, NoteController } from './note.controller';
import { NoteService } from './note.service';

@Module({
	controllers: [ContactNoteController, NoteController],
	providers: [NoteService],
	exports: [NoteService],
})
export class NoteModule {}
