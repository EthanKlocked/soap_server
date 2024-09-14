// room/dto/update-room.dto.ts

import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemDto } from './room-items.dto';

export class UpdateRoomDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ItemDto)
	@IsOptional()
	items?: ItemDto[];

	@IsString()
	@IsOptional()
	wallpaper?: string;
}
