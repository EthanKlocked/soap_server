import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AdRewardController } from './ad-reward.controller';
import { AdRewardService } from './ad-reward.service';
import { AdRewardFeature } from './ad-reward.interface';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

describe('AdRewardController', () => {
	let controller: AdRewardController;
	let mockAdRewardService: Record<string, jest.Mock>;

	beforeEach(async () => {
		mockAdRewardService = {
			getCustomData: jest.fn(),
			verifyAndReward: jest.fn(),
			getBonusStatus: jest.fn()
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AdRewardController],
			providers: [
				{ provide: AdRewardService, useValue: mockAdRewardService }
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<AdRewardController>(AdRewardController);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('ssvCallback', () => {
		it('rawQuery를 추출하여 서비스에 전달한다', async () => {
			const mockReq = {
				url: '/ad-reward/ssv/callback?ad_network=admob&signature=sig&key_id=key1'
			};
			const params = {
				ad_network: 'admob',
				ad_unit: 'unit1',
				custom_data: '{}',
				reward_amount: '1',
				reward_item: 'bonus',
				timestamp: '123',
				transaction_id: 'txn1',
				user_id: 'user1',
				signature: 'sig',
				key_id: 'key1'
			};

			mockAdRewardService.verifyAndReward.mockResolvedValue({ success: true });

			await controller.ssvCallback(mockReq, params);

			expect(mockAdRewardService.verifyAndReward).toHaveBeenCalledWith(
				params,
				'ad_network=admob&signature=sig&key_id=key1'
			);
		});

		it('쿼리스트링이 없으면 빈 문자열을 전달한다', async () => {
			const mockReq = { url: '/ad-reward/ssv/callback' };
			const params = {} as any;

			mockAdRewardService.verifyAndReward.mockResolvedValue({ success: true });

			await controller.ssvCallback(mockReq, params);

			expect(mockAdRewardService.verifyAndReward).toHaveBeenCalledWith(params, '');
		});
	});

	describe('prepare', () => {
		it('customData를 반환한다', async () => {
			const mockReq = { user: { id: 'user1' } };
			const dto = { feature: AdRewardFeature.FRIEND_REQUEST };

			mockAdRewardService.getCustomData.mockResolvedValue(
				'{"userId":"user1","feature":"friend_request"}'
			);

			const result = await controller.prepare(mockReq, dto);

			expect(result).toEqual({
				customData: '{"userId":"user1","feature":"friend_request"}'
			});
			expect(mockAdRewardService.getCustomData).toHaveBeenCalledWith(
				'user1',
				AdRewardFeature.FRIEND_REQUEST
			);
		});

		it('보너스 상한 도달 시 서비스 예외가 전파된다', async () => {
			const mockReq = { user: { id: 'user1' } };
			const dto = { feature: AdRewardFeature.FRIEND_REQUEST };

			mockAdRewardService.getCustomData.mockRejectedValue(
				new BadRequestException('한도 도달')
			);

			await expect(controller.prepare(mockReq, dto)).rejects.toThrow(BadRequestException);
		});
	});

	describe('getStatus', () => {
		it('보너스 현황을 반환한다', async () => {
			const mockReq = { user: { id: 'user1' } };
			const statusResult = {
				currentBonus: 1,
				maxBonus: 3,
				remainingAds: 2
			};

			mockAdRewardService.getBonusStatus.mockResolvedValue(statusResult);

			const result = await controller.getStatus(mockReq, 'friend_request');

			expect(result).toEqual(statusResult);
			expect(mockAdRewardService.getBonusStatus).toHaveBeenCalledWith('user1', 'friend_request');
		});
	});
});
