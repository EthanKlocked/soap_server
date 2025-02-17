import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsString, ValidateIf, MaxLength } from 'class-validator';
import { DiaryReportReason } from '../schema/diaryReport.schema';

export class DiaryReportDto {
	@ApiProperty({
		enum: DiaryReportReason,
		description: 'Report reason',
		example: DiaryReportReason.FALSE_INFO
	})
	@IsNotEmpty()
	@IsEnum(DiaryReportReason)
	reason: DiaryReportReason;

	@ApiProperty({
		required: false,
		description: 'Detailed description when reason is OTHER',
		example: 'This content contains inappropriate material.'
	})
	@ValidateIf(o => o.reason === DiaryReportReason.OTHER)
	@IsNotEmpty({ message: 'Description is required when reason is OTHER' })
	@IsString()
	@MaxLength(500)
	description?: string;
}
