import { IsString, IsDate, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CouponCreateDto {
	@ApiProperty({
		example: '2024-12-31T23:59:59.999Z',
		description: '쿠폰 등록 가능 마감일 (기본값: 1년 후)',
		required: false
	})
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	validUntil?: Date;

	@ApiProperty({
		example: '2024-12-31T23:59:59.999Z',
		description: '멤버십 만료일 (기본값: 1개월 후)',
		required: false
	})
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	expiredDate?: Date;

	@ApiProperty({
		example: 30,
		description: '멤버십 기간 (일 단위, 선택사항 - 우선 적용)',
		required: false,
		minimum: 1
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	membershipDuration?: number;

	@ApiProperty({
		example: '펀딩 참여자 전용 쿠폰',
		description: '쿠폰 설명',
		required: false,
		maxLength: 200
	})
	@IsOptional()
	@IsString()
	@MaxLength(200)
	description?: string;
}
