import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DeactivationMethod {
	SET_INACTIVE = 'set_inactive',
	EXPIRE_NOW = 'expire_now'
}

export class MembershipDeactivateDto {
	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '비활성화할 사용자 ID'
	})
	@IsString()
	userId: string;

	@ApiProperty({
		enum: DeactivationMethod,
		example: DeactivationMethod.SET_INACTIVE,
		description: '비활성화 방법: set_inactive(활성상태 false) 또는 expire_now(만료일을 과거로)',
		required: false
	})
	@IsOptional()
	@IsEnum(DeactivationMethod)
	method?: DeactivationMethod = DeactivationMethod.SET_INACTIVE;
}
