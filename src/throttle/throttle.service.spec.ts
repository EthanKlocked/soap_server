import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ThrottleService } from './throttle.service';
import { PaymentRequiredException } from '@src/membership/exception/payment-required.exception';

describe('ThrottleService', () => {
	let service: ThrottleService;
	let mockCacheManager: any;
	let mockRedisClient: Record<string, jest.Mock>;

	beforeEach(async () => {
		mockRedisClient = {
			incr: jest.fn(),
			expire: jest.fn(),
			eval: jest.fn()
		};

		mockCacheManager = {
			get: jest.fn(),
			set: jest.fn(),
			del: jest.fn(),
			store: {
				getClient: () => mockRedisClient,
				ttl: jest.fn()
			}
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ThrottleService,
				{ provide: CACHE_MANAGER, useValue: mockCacheManager }
			]
		}).compile();

		service = module.get<ThrottleService>(ThrottleService);
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	describe('getBonusCount', () => {
		it('보너스가 없으면 0을 반환한다', async () => {
			mockCacheManager.get.mockResolvedValue(null);

			const result = await service.getBonusCount('user1', 'friend_request');

			expect(result).toBe(0);
			expect(mockCacheManager.get).toHaveBeenCalledWith('ad_bonus:friend_request:user1');
		});

		it('저장된 보너스 카운트를 반환한다', async () => {
			mockCacheManager.get.mockResolvedValue(2);

			const result = await service.getBonusCount('user1', 'friend_request');

			expect(result).toBe(2);
		});
	});

	describe('incrementBonus', () => {
		it('상한 미만이면 true를 반환한다 (Lua 스크립트)', async () => {
			mockRedisClient.eval.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 1); // newVal = 1
			});

			const result = await service.incrementBonus('user1', 'friend_request', 3);

			expect(result).toBe(true);
			expect(mockRedisClient.eval).toHaveBeenCalled();
		});

		it('상한 도달 시 false를 반환한다 (Lua 스크립트 -1)', async () => {
			mockRedisClient.eval.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, -1); // 상한 도달
			});

			const result = await service.incrementBonus('user1', 'friend_request', 3);

			expect(result).toBe(false);
		});
	});

	describe('getEffectiveLimit', () => {
		it('기본 제한 + 보너스를 합산한다', async () => {
			mockCacheManager.get.mockResolvedValue(2);

			const result = await service.getEffectiveLimit('user1', 'friend_request', 5);

			expect(result).toBe(7); // 5 + 2
		});

		it('보너스가 없으면 기본 제한만 반환한다', async () => {
			mockCacheManager.get.mockResolvedValue(null);

			const result = await service.getEffectiveLimit('user1', 'friend_request', 5);

			expect(result).toBe(5);
		});
	});

	describe('checkLimit', () => {
		it('사용량 < 기본제한이면 true (보너스 없음)', async () => {
			mockCacheManager.get
				.mockResolvedValueOnce(3) // throttle count = 3
				.mockResolvedValueOnce(null); // bonus = 0

			const result = await service.checkLimit('user1', 'friend_request', 5);

			expect(result).toBe(true); // 3 < 5+0
		});

		it('사용량 >= 기본제한이지만 보너스로 허용', async () => {
			mockCacheManager.get
				.mockResolvedValueOnce(5) // throttle count = 5
				.mockResolvedValueOnce(2); // bonus = 2

			const result = await service.checkLimit('user1', 'friend_request', 5);

			expect(result).toBe(true); // 5 < 5+2 = 7
		});

		it('사용량 >= 기본제한+보너스이면 false', async () => {
			mockCacheManager.get
				.mockResolvedValueOnce(7) // throttle count = 7
				.mockResolvedValueOnce(2); // bonus = 2

			const result = await service.checkLimit('user1', 'friend_request', 5);

			expect(result).toBe(false); // 7 < 5+2 = 7 → false
		});
	});

	describe('increment', () => {
		it('카운트를 증가시킨다', async () => {
			mockRedisClient.incr.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 2); // 이미 1 이상이므로 expire 안 함
			});

			await service.increment('user1', 'friend_request');

			expect(mockRedisClient.incr).toHaveBeenCalled();
			expect(mockRedisClient.expire).not.toHaveBeenCalled();
		});

		it('첫 번째 증가 시 자정 기준 TTL을 설정한다', async () => {
			mockRedisClient.incr.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 1); // newCount = 1 → 첫 번째
			});
			mockRedisClient.expire.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 1);
			});

			await service.increment('user1', 'friend_request');

			expect(mockRedisClient.expire).toHaveBeenCalled();
			// TTL 값은 자정까지 남은 초 (0 < ttl <= 86400)
			const ttlArg = mockRedisClient.expire.mock.calls[0][1];
			expect(ttlArg).toBeGreaterThan(0);
			expect(ttlArg).toBeLessThanOrEqual(86400);
		});
	});

	describe('checkAndIncrement', () => {
		it('제한 이내면 카운트 증가', async () => {
			// checkLimit: count=3, bonus=0 → 3 < 5
			mockCacheManager.get
				.mockResolvedValueOnce(3) // throttle count
				.mockResolvedValueOnce(null); // bonus

			// increment
			mockRedisClient.incr.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 4);
			});

			await expect(service.checkAndIncrement('user1', 'friend_request', 5)).resolves.toBeUndefined();
		});

		it('제한 초과 시 PaymentRequiredException 발생', async () => {
			// checkLimit: count=5, bonus=2 → 5 < 5+2? → 5 < 7 → true
			// 하지만 count=7, bonus=2 → 7 < 7? → false
			mockCacheManager.get
				.mockResolvedValueOnce(7) // throttle count (checkLimit)
				.mockResolvedValueOnce(2) // bonus (checkLimit)
				.mockResolvedValueOnce(2); // bonus (getEffectiveLimit)

			(mockCacheManager.store as any).ttl.mockResolvedValue(3600);

			await expect(
				service.checkAndIncrement('user1', 'friend_request', 5)
			).rejects.toThrow(PaymentRequiredException);
		});

		it('에러 메시지에 effectiveLimit(base+bonus)이 포함된다', async () => {
			mockCacheManager.get
				.mockResolvedValueOnce(8) // throttle count
				.mockResolvedValueOnce(3) // bonus (checkLimit)
				.mockResolvedValueOnce(3); // bonus (getEffectiveLimit)

			(mockCacheManager.store as any).ttl.mockResolvedValue(7200);

			try {
				await service.checkAndIncrement('user1', 'friend_request', 5);
				fail('Expected PaymentRequiredException');
			} catch (err) {
				expect(err.message).toContain('8회'); // effectiveLimit = 5 + 3
			}
		});
	});

	describe('getSecondsUntilMidnight (간접 테스트)', () => {
		it('increment에서 설정된 TTL이 0~86400 범위이다', async () => {
			mockRedisClient.incr.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 1);
			});
			mockRedisClient.expire.mockImplementation((...args) => {
				const cb = args[args.length - 1];
				cb(null, 1);
			});

			await service.increment('user1', 'test');

			const ttl = mockRedisClient.expire.mock.calls[0][1];
			expect(ttl).toBeGreaterThan(0);
			expect(ttl).toBeLessThanOrEqual(86400);
		});
	});

	describe('getRemainingHours', () => {
		it('TTL이 있으면 시간 단위로 반환한다', async () => {
			(mockCacheManager.store as any).ttl.mockResolvedValue(7200); // 2시간

			const result = await service.getRemainingHours('user1', 'friend_request');

			expect(result).toBe(2);
		});

		it('키가 없으면 24를 반환한다', async () => {
			(mockCacheManager.store as any).ttl.mockResolvedValue(-2);

			const result = await service.getRemainingHours('user1', 'friend_request');

			expect(result).toBe(24);
		});
	});

	describe('reset', () => {
		it('해당 키를 삭제한다', async () => {
			mockCacheManager.del.mockResolvedValue(undefined);

			await service.reset('user1', 'friend_request');

			expect(mockCacheManager.del).toHaveBeenCalledWith('throttle:friend_request:user1');
		});
	});
});
