import { IsArray, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ItemDto } from './room-items.dto';

export class CreateRoomDto {
	@ApiProperty({
		type: [ItemDto],
		description: '방 안의 아이템 목록',
		required: false,
		example: [
			{
				name: 'sofa',
				x: 100,
				y: 150,
				zIndex: 1,
				visible: true,
				type: 'hobby'
			},
			{
				name: 'picture',
				x: 150,
				y: 300,
				zIndex: 2,
				visible: false,
				type: 'interior'
			}
		]
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ItemDto)
	items: ItemDto[];

	@IsMongoId()
	userId: string;
}
