import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@src/diary/schema/diary.schema';

export class DiaryReactionDto {
	@ApiProperty({
		enum: ReactionType,
		description: 'Type of reaction to toggle',
		example: 'best'
	})
	@IsEnum(ReactionType)
	reactionType: ReactionType;
}
