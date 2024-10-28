import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SnsType } from '@src/user/user.interface';

export class UserSnsLoginDto {
	@IsEmail()
	@IsNotEmpty()
	@ApiProperty({ description: 'email', example: 'test@test.com' })
	email: string;

	@IsEnum(SnsType)
	@IsNotEmpty()
	@ApiProperty({
		description: 'SNS provider',
		enum: SnsType,
		example: SnsType.GOOGLE
	})
	sns: SnsType;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'SNS access token', example: 'ya29.a0AfH6SMBx...' })
	token: string;
}
