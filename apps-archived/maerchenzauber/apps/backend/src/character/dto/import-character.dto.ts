import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ImportCharacterDto {
	@IsNotEmpty()
	@IsString()
	@IsUUID()
	characterId: string;
}
