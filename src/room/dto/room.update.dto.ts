import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemDto } from './room-items.dto';

export class UpdateRoomDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ItemDto)
	@IsOptional()
	items?: ItemDto[];
}
