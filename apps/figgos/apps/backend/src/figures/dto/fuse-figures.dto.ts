import { IsUUID } from 'class-validator';

export class FuseFiguresDto {
	@IsUUID()
	figureIdA!: string;

	@IsUUID()
	figureIdB!: string;
}
