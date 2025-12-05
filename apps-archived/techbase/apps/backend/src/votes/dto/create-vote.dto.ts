import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateVoteDto {
	@IsString()
	@IsNotEmpty()
	softwareId: string;

	@IsString()
	@IsNotEmpty()
	metric: string;

	@IsInt()
	@Min(1)
	@Max(5)
	rating: number;
}
