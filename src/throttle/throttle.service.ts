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

	// true: 허용, false: 제한 초과
	async checkLimit(userId: string, feature: string, maxCount: number): Promise<boolean> {
		const key = this.getKey(userId, feature);
		const count = (await this.cacheManager.get<number>(key)) || 0;
		return count < maxCount;
	}

	// ttl 기본값: 86400초 (24시간)
	async increment(userId: string, feature: string, ttl: number = 86400): Promise<void> {
		const key = this.getKey(userId, feature);
		const store = this.cacheManager.store as any;
		const client = store.getClient();

		// promisify로 제대로 된 숫자 값 받기
		const incrAsync = promisify(client.incr).bind(client);
		const expireAsync = promisify(client.expire).bind(client);

		const newCount = await incrAsync(key);

		if (newCount === 1) {
			await expireAsync(key, ttl);
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
	async checkAndIncrement(
		userId: string,
		feature: string,
		limit: number,
		ttl: number = 86400
	): Promise<void> {
		const canCall = await this.checkLimit(userId, feature, limit);

		if (!canCall) {
			const remainingHours = await this.getRemainingHours(userId, feature);
			throw new PaymentRequiredException(
				`일일 이용 한도(${limit}회)를 초과했습니다. ${remainingHours}시간 후 초기화됩니다.`
			);
		}

		await this.increment(userId, feature, ttl);
	}
}
