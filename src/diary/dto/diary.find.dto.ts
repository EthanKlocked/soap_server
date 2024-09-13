import { IsInt, IsOptional, IsNotEmpty, IsPositive, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class DiaryFindDto {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Type(() => Number)
	page?: number = 1;

	@IsOptional()
	@IsInt()
	@IsPositive()
	@Type(() => Number)
	limit?: number = 10;

	@IsOptional()
	@IsInt()
	@Min(2000)
	@Max(new Date().getFullYear())
	@Type(() => Number)
	year: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(12)
	@Type(() => Number)
	month: number;
}
