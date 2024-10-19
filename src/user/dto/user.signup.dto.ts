import { IsEmail, IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// LOCAL SIGN UP
export class UserSignupDto {
	@IsEmail()
	@IsNotEmpty()
	@ApiProperty({ description: 'email', example: 'test@test.com' })
	email: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'password', example: 'test123' })
	password: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({ description: 'name', example: 'ethank' })
	name: string;
}

// SNS SIGN UP
export enum SnsType {
	KAKAO = 'kakao',
	GOOGLE = 'google',
	APPLE = 'apple'
}

export class UserSnsSignupDto extends UserSignupDto {
	@IsEnum(SnsType)
	@IsNotEmpty()
	@ApiProperty({ description: 'SNS type', enum: SnsType, example: SnsType.KAKAO })
	sns: SnsType;
}
