import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AdRewardService } from './ad-reward.service';
import { ThrottleService } from '@src/throttle/throttle.service';
import { AdRewardFeature } from './ad-reward.interface';

describe('AdRewardService', () => {
	let service: AdRewardService;
	let mockThrottleService: Record<string, jest.Mock>;
	let mockCacheManager: any;
	let mockAdRewardLogModel: Record<string, jest.Mock>;
	let mockConfigService: Record<string, jest.Mock>;
	let mockRedisClient: Record<string, jest.Mock>;

	const originalNodeEnv = process.env.NODE_ENV;

	beforeEach(async () => {
		mockThrottleService = {
			getBonusCount: jest.fn(),
			incrementBonus: jest.fn()
		};

		mockRedisClient = {
			setex: jest.fn()
		};

		mockCacheManager = {
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn(),
			store: { getClient: () => mockRedisClient }
		};

		mockAdRewardLogModel = {
			create: jest.fn().mockResolvedValue({})
		};

		mockConfigService = {
			get: jest.fn().mockReturnValue('false') // SSV disabled by default in test
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AdRewardService,
				{ provide: ThrottleService, useValue: mockThrottleService },
				{ provide: CACHE_MANAGER, useValue: mockCacheManager },
				{ provide: getModelToken('AdRewardLog'), useValue: mockAdRewardLogModel },
				{ provide: HttpService, useValue: { get: jest.fn() } },
				{ provide: ConfigService, useValue: mockConfigService }
			]
		}).compile();

		service = module.get<AdRewardService>(AdRewardService);
		process.env.NODE_ENV = 'test';
	});

	afterEach(() => {
		jest.clearAllMocks();
		process.env.NODE_ENV = originalNodeEnv;
	});

	describe('getCustomData', () => {
		it('보너스 잔여가 있으면 customData JSON을 반환한다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(1);

			const result = await service.getCustomData('user1', AdRewardFeature.FRIEND_REQUEST);

			const parsed = JSON.parse(result);
			expect(parsed.userId).toBe('user1');
			expect(parsed.feature).toBe('friend_request');
		});

		it('보너스 상한 도달 시 BadRequestException을 던진다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(3); // maxBonus = 3

			await expect(
				service.getCustomData('user1', AdRewardFeature.FRIEND_REQUEST)
			).rejects.toThrow(BadRequestException);
		});

		it('에러 메시지에 상한 횟수가 포함된다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(3);

			await expect(
				service.getCustomData('user1', AdRewardFeature.FRIEND_REQUEST)
			).rejects.toThrow('3회');
		});
	});

	describe('verifyAndReward', () => {
		const validParams = {
			ad_network: 'admob',
			ad_unit: 'unit1',
			custom_data: JSON.stringify({ userId: 'user1', feature: 'friend_request' }),
			reward_amount: '1',
			reward_item: 'bonus',
			timestamp: '1234567890',
			transaction_id: 'txn_001',
			user_id: 'user1',
			signature: 'sig',
			key_id: 'key1'
		};
		const rawQuery = 'ad_network=admob&ad_unit=unit1&custom_data=%7B%7D&signature=sig&key_id=key1';

		it('SSV 비활성 시 서명 검증 없이 보너스를 지급한다', async () => {
			mockCacheManager.get.mockResolvedValue(null); // 중복 아님
			mockThrottleService.incrementBonus.mockResolvedValue(true);
			mockRedisClient.setex.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 'OK');
			});

			const result = await service.verifyAndReward(validParams, rawQuery);

			expect(result).toEqual({ success: true });
			expect(mockThrottleService.incrementBonus).toHaveBeenCalledWith('user1', 'friend_request', 3);
		});

		it('중복 트랜잭션은 멱등으로 success: true를 반환한다', async () => {
			mockCacheManager.get.mockResolvedValue('1'); // 이미 처리됨

			const result = await service.verifyAndReward(validParams, rawQuery);

			expect(result).toEqual({ success: true });
			expect(mockThrottleService.incrementBonus).not.toHaveBeenCalled();
		});

		it('custom_data가 잘못되면 BadRequestException', async () => {
			const badParams = { ...validParams, custom_data: 'invalid-json' };
			mockCacheManager.get.mockResolvedValue(null);

			await expect(
				service.verifyAndReward(badParams, rawQuery)
			).rejects.toThrow(BadRequestException);
		});

		it('보너스 상한 도달 시 success: false를 반환한다', async () => {
			mockCacheManager.get.mockResolvedValue(null);
			mockThrottleService.incrementBonus.mockResolvedValue(false); // 상한 도달
			mockRedisClient.setex.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 'OK');
			});

			const result = await service.verifyAndReward(validParams, rawQuery);

			expect(result).toEqual({ success: false });
		});

		it('트랜잭션 처리 후 Redis에 dedup 키를 저장한다', async () => {
			mockCacheManager.get.mockResolvedValue(null);
			mockThrottleService.incrementBonus.mockResolvedValue(true);
			mockRedisClient.setex.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 'OK');
			});

			await service.verifyAndReward(validParams, rawQuery);

			expect(mockRedisClient.setex).toHaveBeenCalledWith(
				'ad_txn:txn_001',
				172800, // AD_TXN_DEDUP_TTL
				'1',
				expect.any(Function)
			);
		});

		it('MongoDB에 로그를 기록한다', async () => {
			mockCacheManager.get.mockResolvedValue(null);
			mockThrottleService.incrementBonus.mockResolvedValue(true);
			mockRedisClient.setex.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 'OK');
			});

			await service.verifyAndReward(validParams, rawQuery);

			expect(mockAdRewardLogModel.create).toHaveBeenCalledWith(
				expect.objectContaining({
					userId: 'user1',
					feature: 'friend_request',
					transactionId: 'txn_001',
					adNetwork: 'admob',
					rewardAmount: 1
				})
			);
		});

		it('프로덕션에서는 SSV가 항상 활성화된다', async () => {
			process.env.NODE_ENV = 'production';
			mockCacheManager.get.mockResolvedValue(null);

			// verifySsvSignature가 실패하면 UnauthorizedException
			await expect(
				service.verifyAndReward(validParams, rawQuery)
			).rejects.toThrow(UnauthorizedException);
		});
	});

	describe('getBonusStatus', () => {
		it('현재 보너스, 최대 보너스, 남은 광고 횟수를 반환한다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(1);

			const result = await service.getBonusStatus('user1', 'friend_request');

			expect(result).toEqual({
				currentBonus: 1,
				maxBonus: 3,
				remainingAds: 2
			});
		});

		it('보너스가 최대이면 remainingAds는 0이다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(3);

			const result = await service.getBonusStatus('user1', 'friend_request');

			expect(result).toEqual({
				currentBonus: 3,
				maxBonus: 3,
				remainingAds: 0
			});
		});

		it('등록되지 않은 feature는 maxBonus=0이다', async () => {
			mockThrottleService.getBonusCount.mockResolvedValue(0);

			const result = await service.getBonusStatus('user1', 'unknown_feature');

			expect(result).toEqual({
				currentBonus: 0,
				maxBonus: 0,
				remainingAds: 0
			});
		});
	});
});
