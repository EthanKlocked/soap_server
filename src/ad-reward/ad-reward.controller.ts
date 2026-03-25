import { Controller, Get, Post, Body, Param, Query, Req, Request, UseGuards } from '@nestjs/common';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiParam,
	ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { AdRewardService } from './ad-reward.service';
import { AdRewardPrepareDto } from './dto/ad-reward.dto';
import { AdmobSsvParams, AdRewardFeature } from './ad-reward.interface';

@ApiTags('Ad-Reward')
@Controller('ad-reward')
export class AdRewardController {
	constructor(private readonly adRewardService: AdRewardService) {}

	// === SSV Webhook (인증 없음 — AdMob 서버가 직접 호출) ===
	@Get('ssv/callback')
	@ApiOperation({
		summary: 'AdMob SSV 콜백',
		description: 'AdMob 서버가 광고 시청 완료 시 호출하는 웹훅. ECDSA 서명으로 검증합니다.'
	})
	@ApiResponse({ status: 200, description: '보상 처리 완료' })
	@ApiResponse({ status: 401, description: '서명 검증 실패' })
	async ssvCallback(@Req() req, @Query() params: AdmobSsvParams) {
		const rawQuery = req.url.split('?')[1] || '';
		return this.adRewardService.verifyAndReward(params, rawQuery);
	}

	// === 사용자 엔드포인트 (JWT 인증 필요) ===
	@UseGuards(ApiGuard, JwtAuthGuard)
	@ApiSecurity('api-key')
	@ApiSecurity('x-access-token')
	@Post('prepare')
	@ApiOperation({
		summary: '광고 시청 준비',
		description:
			'광고 시청 전 호출합니다. 반환된 customData를 AdMob 보상형 광고 요청 시 전달해야 합니다.'
	})
	@ApiBody({ type: AdRewardPrepareDto })
	@ApiResponse({
		status: 200,
		description: 'custom_data 발급 성공',
		schema: {
			type: 'object',
			properties: {
				customData: {
					type: 'string',
					example: '{"userId":"507f1f77bcf86cd799439011","feature":"friend_request"}'
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: '광고 보상 한도 도달' })
	async prepare(@Request() req, @Body() dto: AdRewardPrepareDto) {
		const customData = await this.adRewardService.getCustomData(req.user.id, dto.feature);
		return { customData };
	}

	@UseGuards(ApiGuard, JwtAuthGuard)
	@ApiSecurity('api-key')
	@ApiSecurity('x-access-token')
	@Get('status/:feature')
	@ApiOperation({
		summary: '광고 보상 현황 조회',
		description: '특정 기능의 현재 광고 보너스 횟수 및 남은 광고 시청 가능 횟수를 반환합니다.'
	})
	@ApiParam({
		name: 'feature',
		enum: AdRewardFeature,
		description: '조회할 기능'
	})
	@ApiResponse({
		status: 200,
		description: '보상 현황',
		schema: {
			type: 'object',
			properties: {
				currentBonus: { type: 'number', example: 1 },
				maxBonus: { type: 'number', example: 3 },
				remainingAds: { type: 'number', example: 2 }
			}
		}
	})
	async getStatus(@Request() req, @Param('feature') feature: string) {
		return this.adRewardService.getBonusStatus(req.user.id, feature);
	}
}
