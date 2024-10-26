import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateItemDto } from './update-items.dto';

export class UpdateRoomDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateItemDto)
	@IsOptional()
	items?: UpdateItemDto[];
}
