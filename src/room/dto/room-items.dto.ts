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
		example: 1,
		description: '아이템의 z-index'
	})
	@IsNumber()
	zIndex: number;

	@ApiProperty({
		example: true,
		description: '아이템 노출/비노출'
	})
	@IsBoolean()
	visible: boolean;

	@ApiProperty({
		example: 'hobby',
		description: 'hobby인 경우 움직일 수 있고, interior는 움직일 수 없음'
	})
	type: 'hobby' | 'interior';
}
