import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FriendRequestDto {
	@ApiProperty({
		description: 'The ID of the user to send the friend request to',
		example: '60d5ecb74e9dae1e6839649c'
	})
	@IsNotEmpty()
	@IsMongoId()
	receiverId: string;

	@ApiProperty({
		description: 'A message to accompany the friend request',
		example: "Hey, let's be friends!"
	})
	@IsString()
	message: string;
}
