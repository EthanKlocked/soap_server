import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TestPushDto {
	@ApiProperty({
		description: '테스트 알림 제목',
		example: '테스트 알림',
		required: false
	})
	@IsString()
	@IsOptional()
	title?: string;

	@ApiProperty({
		description: '테스트 알림 내용',
		example: '알림 설정이 정상적으로 작동하고 있습니다!',
		required: false
	})
	@IsString()
	@IsOptional()
	body?: string;
}
