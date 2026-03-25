import { IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdRewardFeature } from '../ad-reward.interface';

export class AdRewardPrepareDto {
	@ApiProperty({
		description: '보너스를 받을 기능',
		enum: AdRewardFeature,
		example: AdRewardFeature.FRIEND_REQUEST
	})
	@IsNotEmpty()
	@IsEnum(AdRewardFeature)
	feature: AdRewardFeature;
}
