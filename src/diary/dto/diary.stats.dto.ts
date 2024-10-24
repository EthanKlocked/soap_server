import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DiaryStatsDto {
	@ApiProperty({
		example: 2024,
		description: 'Target year'
	})
	@IsNumber()
	@Type(() => Number)
	@Min(2000)
	@Max(2100)
	year: number;

	@ApiProperty({
		example: 1,
		description: 'Target month (1-12)'
	})
	@IsNumber()
	@Type(() => Number)
	@Min(1)
	@Max(12)
	month: number;
}
