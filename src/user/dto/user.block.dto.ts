import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserBlockDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		description: 'The ID of the user to block',
		example: '5f9d7a3b9d3f2c1a3c9d3f2c'
	})
	userToBlockId: string;
}
