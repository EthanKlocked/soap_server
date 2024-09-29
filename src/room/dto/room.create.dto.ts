import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './room-items.dto';

export class CreateRoomDto {
	@ApiProperty({
		example: '내 방',
		description: '방의 이름'
	})
	@IsString()
	name: string;

	@ApiProperty({
		type: [ItemDto],
		description: '방 안의 아이템 목록',
		required: false,
		example: [
			{
				name: '소파',
				x: 100,
				y: 150,
				zIndex: 1,
				imageBase64:
					'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
			}
		]
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ItemDto)
	@IsOptional()
	items?: ItemDto[];

	@ApiProperty({
		example:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
		description: '방 벽지의 Base64 인코딩 이미지 문자열',
		required: false
	})
	@IsString()
	@IsOptional()
	wallpaper?: string;
}
