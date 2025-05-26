import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateItemDto } from './update-items.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoomDto {
	@ApiProperty({
		type: [UpdateItemDto],
		description: '업데이트할 아이템 목록',
		required: false
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => UpdateItemDto)
	@IsOptional()
	items?: UpdateItemDto[];
}
