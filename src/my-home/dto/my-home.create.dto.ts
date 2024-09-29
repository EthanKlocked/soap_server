import { IsString, IsEnum, IsNumber, Min, Max, IsMongoId, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../schema/my-home.schema';

export class CreateMyHomeDto {
	@ApiProperty({
		enum: CategoryType,
		example: 'movie',
		description: '카테고리 타입 (예: movie, book, etc.)'
	})
	@IsEnum(CategoryType)
	category: CategoryType;

	@ApiProperty({
		example: '정말 재미있는 영화였습니다. 강력 추천합니다!',
		description: '리뷰 내용'
	})
	@IsString()
	review: string;

	@ApiProperty({
		example: 4.5,
		description: '평점 (0-5 사이, 영화 카테고리일 경우에만 필요)',
		minimum: 0,
		maximum: 5,
		required: false
	})
	@ValidateIf(o => o.category === 'movie')
	@IsNumber()
	@Min(0)
	@Max(5)
	rating: number;

	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '사용자 ID (MongoDB ObjectId)'
	})
	@IsMongoId()
	userId: string;
}
