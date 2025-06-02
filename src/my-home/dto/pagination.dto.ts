import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';

export class PaginationQueryDto {
	@ApiProperty({
		description: '페이지 번호 (1부터 시작)',
		example: 1,
		minimum: 1,
		required: false,
		default: 1
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiProperty({
		description: '페이지당 항목 수',
		example: 10,
		minimum: 1,
		maximum: 100,
		required: false,
		default: 10
	})
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10;

	@ApiProperty({
		description: '정렬 기준 필드',
		example: 'createdAt',
		enum: ['createdAt', 'updatedAt', 'category'],
		required: false,
		default: 'createdAt'
	})
	@IsOptional()
	@IsString()
	@IsIn(['createdAt', 'updatedAt', 'category'])
	sortBy?: string = 'createdAt';

	@ApiProperty({
		description: '정렬 순서',
		example: 'desc',
		enum: ['asc', 'desc'],
		required: false,
		default: 'desc'
	})
	@IsOptional()
	@IsString()
	@IsIn(['asc', 'desc'])
	sortOrder?: 'asc' | 'desc' = 'desc';
}

export class PaginationMetaDto {
	@ApiProperty({ description: '현재 페이지', example: 1 })
	currentPage: number;

	@ApiProperty({ description: '페이지당 항목 수', example: 10 })
	itemsPerPage: number;

	@ApiProperty({ description: '전체 항목 수', example: 50 })
	totalItems: number;

	@ApiProperty({ description: '전체 페이지 수', example: 5 })
	totalPages: number;

	@ApiProperty({ description: '다음 페이지 존재 여부', example: true })
	hasNextPage: boolean;

	@ApiProperty({ description: '이전 페이지 존재 여부', example: false })
	hasPreviousPage: boolean;
}

export class PaginatedResponseDto<T> {
	@ApiProperty({ description: '데이터 목록' })
	data: T[];

	@ApiProperty({ description: '페이지네이션 메타 정보', type: PaginationMetaDto })
	meta: PaginationMetaDto;
}
