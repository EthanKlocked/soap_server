import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemDto } from './room-items.dto';

export class CreateRoomDto {
	@IsString()
	name: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ItemDto)
	@IsOptional()
	items?: ItemDto[];

	@IsString()
	@IsOptional()
	wallpaper?: string;
}
