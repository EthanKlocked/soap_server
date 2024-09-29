import { IsString, IsNumber, IsOptional, MaxLength } from 'class-validator';
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
		description: '아이템의 Z-index (겹침 순서)',
		required: false
	})
	@IsNumber()
	@IsOptional()
	zIndex?: number;

	@ApiProperty({
		example:
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
		description: '아이템 이미지의 Base64 인코딩 문자열'
	})
	@IsString()
	@MaxLength(5 * 1024 * 1024)
	imageBase64: string;
}
