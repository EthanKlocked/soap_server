import {
	IsString,
	IsEnum,
	IsNumber,
	Min,
	Max,
	IsOptional,
	IsMongoId,
	ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../schema/my-home.schema';

export class UpdateMyHomeDto {
	@ApiProperty({
		enum: CategoryType,
		example: 'movie',
		description: '카테고리 타입 (예: movie, book, etc.)',
		required: false
	})
	@IsOptional()
	@IsEnum(CategoryType)
	category?: CategoryType;

	@ApiProperty({
		example: '다시 보니 더욱 좋았습니다. 강력 추천합니다!',
		description: '수정된 리뷰 내용',
		required: false
	})
	@IsOptional()
	@IsString()
	review?: string;

	@ApiProperty({
		example: 4.5,
		description: '수정된 평점 (0-5 사이, 영화 카테고리일 경우에만 해당)',
		minimum: 0,
		maximum: 5,
		required: false
	})
	@IsOptional()
	@ValidateIf(o => o.category === 'movie')
	@IsNumber()
	@Min(0)
	@Max(5)
	rating?: number;

	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '수정할 사용자 ID (MongoDB ObjectId)',
		required: false
	})
	@IsOptional()
	@IsMongoId()
	userId?: string;
}
