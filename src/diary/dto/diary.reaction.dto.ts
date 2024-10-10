import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@src/diary/diary.interface';

export class DiaryReactionDto {
	@ApiProperty({
		enum: ReactionType,
		description: 'Type of reaction to toggle',
		example:
			'<best | funny | touching | good | empathy | sad | angry | amazing | support | cheer>'
	})
	@IsEnum(ReactionType)
	reactionType: ReactionType;
}
