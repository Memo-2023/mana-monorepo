import { Type } from 'class-transformer';
import { ValidateNested, IsArray, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { CreateErrorLogDto } from './create-error-log.dto';

export class BatchErrorLogDto {
	@IsArray()
	@ValidateNested({ each: true })
	@ArrayMinSize(1)
	@ArrayMaxSize(100)
	@Type(() => CreateErrorLogDto)
	errors: CreateErrorLogDto[];
}
