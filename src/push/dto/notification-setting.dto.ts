import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateNotificationSettingDto {
	@ApiProperty({
		description: '전체 알림 활성화 여부',
		example: true,
		required: false
	})
	@IsBoolean()
	@IsOptional()
	isEnabled?: boolean;
}

export class NotificationSettingResponseDto {
	@ApiProperty({ description: '사용자 ID', example: '507f1f77bcf86cd799439011' })
	userId: string;

	@ApiProperty({ description: '전체 알림 활성화 여부', example: true })
	isEnabled: boolean;

	@ApiProperty({ description: '생성 시간', example: '2024-10-01T09:00:00.000Z' })
	createdAt: string;

	@ApiProperty({ description: '수정 시간', example: '2024-10-01T09:00:00.000Z' })
	updatedAt: string;
}
