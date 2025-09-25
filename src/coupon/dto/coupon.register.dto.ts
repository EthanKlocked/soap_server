import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CouponRegisterDto {
	@ApiProperty({
		example: 'FUNDING2024',
		description: '등록할 쿠폰 코드',
		maxLength: 20
	})
	@IsNotEmpty()
	@IsString()
	@MaxLength(20)
	code: string;
}
