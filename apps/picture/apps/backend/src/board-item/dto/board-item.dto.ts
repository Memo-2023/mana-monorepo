import {
	IsString,
	IsOptional,
	IsNumber,
	IsArray,
	ValidateNested,
	IsObject,
	IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TextProperties } from '../../db/schema/board-items.schema';

export class AddImageToBoardDto {
	@IsString()
	boardId: string;

	@IsString()
	imageId: string;

	@IsNumber()
	@IsOptional()
	positionX?: number;

	@IsNumber()
	@IsOptional()
	positionY?: number;
}

export class AddTextToBoardDto {
	@IsString()
	boardId: string;

	@IsString()
	@IsOptional()
	content?: string;

	@IsNumber()
	@IsOptional()
	positionX?: number;

	@IsNumber()
	@IsOptional()
	positionY?: number;

	@IsNumber()
	@IsOptional()
	fontSize?: number;

	@IsString()
	@IsOptional()
	color?: string;

	@IsObject()
	@IsOptional()
	properties?: TextProperties;
}

export class UpdateBoardItemDto {
	@IsNumber()
	@IsOptional()
	positionX?: number;

	@IsNumber()
	@IsOptional()
	positionY?: number;

	@IsNumber()
	@IsOptional()
	scaleX?: number;

	@IsNumber()
	@IsOptional()
	scaleY?: number;

	@IsNumber()
	@IsOptional()
	rotation?: number;

	@IsNumber()
	@IsOptional()
	zIndex?: number;

	@IsNumber()
	@IsOptional()
	opacity?: number;

	@IsNumber()
	@IsOptional()
	width?: number;

	@IsNumber()
	@IsOptional()
	height?: number;

	@IsString()
	@IsOptional()
	textContent?: string;

	@IsNumber()
	@IsOptional()
	fontSize?: number;

	@IsString()
	@IsOptional()
	color?: string;

	@IsObject()
	@IsOptional()
	properties?: TextProperties;
}

export class UpdateBoardItemWithIdDto extends UpdateBoardItemDto {
	@IsString()
	id: string;
}

export class UpdateBoardItemsDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateBoardItemWithIdDto)
	items: UpdateBoardItemWithIdDto[];
}

export class RemoveBoardItemsDto {
	@IsArray()
	@IsString({ each: true })
	ids: string[];
}

export class ChangeZIndexDto {
	@IsString()
	@IsIn(['up', 'down', 'top', 'bottom'])
	direction: 'up' | 'down' | 'top' | 'bottom';
}
