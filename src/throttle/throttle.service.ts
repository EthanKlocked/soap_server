import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PaymentRequiredException } from '@src/membership/exception/payment-required.exception';
import { promisify } from 'util';

@Injectable()
export class ThrottleService {
	constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

	private getKey(userId: string, feature: string): string {
		return `throttle:${feature}:${userId}`;
	}

	private getBonusKey(userId: string, feature: string): string {
		return `ad_bonus:${feature}:${userId}`;
	}

	// 자정(KST)까지 남은 초 계산
	private getSecondsUntilMidnight(): number {
		const now = new Date();
		const kstOffset = 9 * 60 * 60 * 1000; // UTC+9
		const kstNow = new Date(now.getTime() + kstOffset);
		const kstMidnight = new Date(kstNow);
		kstMidnight.setUTCHours(24, 0, 0, 0);
		return Math.ceil((kstMidnight.getTime() - kstNow.getTime()) / 1000) || 86400;
	}

	// 광고 보너스 카운트 조회
	async getBonusCount(userId: string, feature: string): Promise<number> {
		const key = this.getBonusKey(userId, feature);
		return (await this.cacheManager.get<number>(key)) || 0;
	}

	// 광고 보너스 증가 (상한 체크 포함, 원자적). true: 성공, false: 상한 도달
	async incrementBonus(userId: string, feature: string, maxBonus: number): Promise<boolean> {
		const key = this.getBonusKey(userId, feature);
		const store = this.cacheManager.store as any;
		const client = store.getClient();

		const evalAsync = promisify(client.eval).bind(client);

		// Lua: 원자적으로 상한 체크 + INCR + TTL 설정
		const luaScript = `
			local current = tonumber(redis.call('GET', KEYS[1]) or '0')
			if current >= tonumber(ARGV[1]) then return -1 end
			local newVal = redis.call('INCR', KEYS[1])
			if newVal == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
			return newVal
		`;

		const result = await evalAsync(luaScript, 1, key, maxBonus, this.getSecondsUntilMidnight());
		return result !== -1;
	}

	// 실효 제한 (기본 제한 + 보너스)
	async getEffectiveLimit(userId: string, feature: string, baseLimit: number): Promise<number> {
		const bonus = await this.getBonusCount(userId, feature);
		return baseLimit + bonus;
	}

	// true: 허용, false: 제한 초과 (보너스 자동 합산)
	async checkLimit(userId: string, feature: string, maxCount: number): Promise<boolean> {
		const key = this.getKey(userId, feature);
		const count = (await this.cacheManager.get<number>(key)) || 0;
		const bonus = await this.getBonusCount(userId, feature);
		return count < maxCount + bonus;
	}

	// 자정(KST) 기준 TTL로 카운트 증가
	async increment(userId: string, feature: string): Promise<void> {
		const key = this.getKey(userId, feature);
		const store = this.cacheManager.store as any;
		const client = store.getClient();

		const incrAsync = promisify(client.incr).bind(client);
		const expireAsync = promisify(client.expire).bind(client);

		const newCount = await incrAsync(key);

		if (newCount === 1) {
			await expireAsync(key, this.getSecondsUntilMidnight());
		}
	}

	// 남은 시간 (시간 단위)
	async getRemainingHours(userId: string, feature: string): Promise<number> {
		const key = this.getKey(userId, feature);
		const store = this.cacheManager.store as any;

		if (!store.ttl) {
			return 24;
		}

		try {
			const ttl = await store.ttl(key);
			if (ttl === -2 || ttl === -1) {
				return 24;
			}
			return Math.ceil(ttl / 3600);
		} catch {
			return 24;
		}
	}

	async getCurrentCount(userId: string, feature: string): Promise<number> {
		const key = this.getKey(userId, feature);
		return (await this.cacheManager.get<number>(key)) || 0;
	}

	async reset(userId: string, feature: string): Promise<void> {
		const key = this.getKey(userId, feature);
		await this.cacheManager.del(key);
	}

	// 체크 + 증가를 한번에 처리 (제한 초과 시 예외 발생)
	async checkAndIncrement(userId: string, feature: string, limit: number): Promise<void> {
		const canCall = await this.checkLimit(userId, feature, limit);

		if (!canCall) {
			const effectiveLimit = await this.getEffectiveLimit(userId, feature, limit);
			const remainingHours = await this.getRemainingHours(userId, feature);
			throw new PaymentRequiredException(
				`일일 이용 한도(${effectiveLimit}회)를 초과했습니다. ${remainingHours}시간 후 초기화됩니다.`
			);
		}

		await this.increment(userId, feature);
	}
}
