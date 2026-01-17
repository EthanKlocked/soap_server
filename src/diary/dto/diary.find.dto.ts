import {
	IsInt,
	IsOptional,
	IsPositive,
	Min,
	Max,
	IsBoolean,
	ValidatorConstraint,
	ValidatorConstraintInterface,
	Validate
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'maxCurrentYear' })
export class MaxCurrentYearConstraint implements ValidatorConstraintInterface {
	validate(year: number): boolean {
		return year === undefined || year === null || year <= new Date().getFullYear();
	}

	defaultMessage(): string {
		return `year must not be greater than ${new Date().getFullYear()}`;
	}
}

export class DiaryFindDto {
	@ApiProperty({
		example: 1,
		description: '페이지 번호',
		default: 1,
		required: false
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page?: number = 1;

	@ApiProperty({
		example: 10,
		description: '페이지당 항목 수',
		default: 10,
		required: false
	})
	@IsOptional()
	@IsInt()
	@IsPositive()
	@Type(() => Number)
	limit?: number = 10;

	@ApiProperty({
		example: 2023,
		description: '조회할 연도',
		minimum: 2000,
		required: false
	})
	@IsOptional()
	@IsInt()
	@Min(2000)
	@Validate(MaxCurrentYearConstraint)
	@Type(() => Number)
	year?: number;

	@ApiProperty({
		example: 6,
		description: '조회할 월',
		minimum: 1,
		maximum: 12,
		required: false
	})
	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(12)
	@Type(() => Number)
	month?: number;

	@ApiProperty({
		example: true,
		description: '공개 여부 (true: 공개, false: 비공개, undefined: 모두)',
		required: false
	})
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => {
		if (typeof value === 'string') return value.toLowerCase() === 'true';
		return Boolean(value);
	})
	isPublic?: boolean;
}
