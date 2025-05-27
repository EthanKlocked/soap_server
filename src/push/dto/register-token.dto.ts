import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterTokenDto {
	@ApiProperty({
		description: '사용자 ID (자동으로 설정됨)',
		example: '507f1f77bcf86cd799439011',
		required: false
	})
	@IsString()
	@IsOptional()
	userId?: string;

	@ApiProperty({
		description: 'FCM 디바이스 토큰',
		example: 'dGVzdF90b2tlbl9leGFtcGxl...',
		required: true
	})
	@IsNotEmpty()
	@IsString()
	deviceToken: string;

	@ApiProperty({
		description: '디바이스 타입',
		example: 'android',
		required: false
	})
	@IsString()
	@IsOptional()
	deviceType?: string;
}
