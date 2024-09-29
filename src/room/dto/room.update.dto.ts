import { IsString, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './room-items.dto';

export class UpdateRoomDto {
	@ApiProperty({
		example: '새로운 내 방',
		description: '업데이트할 방의 새 이름',
		required: false
	})
	@IsString()
	@IsOptional()
	name?: string;

	@ApiProperty({
		type: [ItemDto],
		description: '업데이트할 방 안의 아이템 목록',
		required: false,
		example: [
			{
				name: '책상',
				x: 200,
				y: 100,
				zIndex: 2,
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
		description: '업데이트할 방 벽지의 Base64 인코딩 이미지 문자열',
		required: false
	})
	@IsString()
	@IsOptional()
	wallpaper?: string;
}
