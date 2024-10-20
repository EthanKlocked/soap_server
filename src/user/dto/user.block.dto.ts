import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class UserBlockDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		description: 'The ID of the user to block',
		example: '5f9d7a3b9d3f2c1a3c9d3f2c'
	})
	userToBlockId: string;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	@ApiProperty({
		description: 'The reason for blocking the user',
		example: 'Inappropriate behavior',
		required: false,
		maxLength: 200
	})
	blockedReason?: string;
}
