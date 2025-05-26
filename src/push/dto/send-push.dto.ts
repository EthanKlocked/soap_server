import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPushDto {
	@ApiProperty({
		description: '푸시 알림 제목',
		example: '새로운 메시지가 도착했습니다!',
		required: true
	})
	@IsNotEmpty()
	@IsString()
	title: string;

	@ApiProperty({
		description: '푸시 알림 내용',
		example: '친구가 새로운 일기를 작성했습니다.',
		required: true
	})
	@IsNotEmpty()
	@IsString()
	body: string;

	@ApiProperty({
		description: '추가 데이터 (선택사항)',
		example: { type: 'diary', diaryId: '507f1f77bcf86cd799439011' },
		required: false
	})
	@IsOptional()
	@IsObject()
	data?: Record<string, any>;
}
