import { IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ItemDto {
	@ApiProperty({
		example: '소파',
		description: '아이템의 이름'
	})
	@IsString()
	name: string;

	@ApiProperty({
		example: 100,
		description: '아이템의 X 좌표 위치'
	})
	@IsNumber()
	x: number;

	@ApiProperty({
		example: 150,
		description: '아이템의 Y 좌표 위치'
	})
	@IsNumber()
	y: number;

	@ApiProperty({
		example: true,
		description: '아이템 노출/비노출'
	})
	@IsBoolean()
	visible: boolean;
}
