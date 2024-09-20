import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserSnsDto {
	@IsEmail()
	@IsNotEmpty()
	@ApiProperty({ description: 'email', example: 'test@test.com' })
	email: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'name', example: 'Ethan Kim' })
	name: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'SNS provider', example: 'google' })
	sns: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'SNS access token', example: 'ya29.a0AfH6SMBx...' })
	token: string;
}
