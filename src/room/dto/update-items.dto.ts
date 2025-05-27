import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ItemType } from '../room.constants';

export class UpdateItemDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsNumber()
	@IsOptional()
	x?: number;

	@IsNumber()
	@IsOptional()
	y?: number;

	@IsNumber()
	@IsOptional()
	zIndex?: number;

	@IsBoolean()
	@IsOptional()
	visible?: boolean;

	@IsString()
	@IsOptional()
	type?: ItemType;
}
