import {
	Injectable,
	Inject,
	BadRequestException,
	UnauthorizedException,
	Logger
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { promisify } from 'util';
import { ThrottleService } from '@src/throttle/throttle.service';
import { AdRewardLog } from './schema/ad-reward-log.schema';
import { AdRewardFeature, AdmobSsvParams } from './ad-reward.interface';
import { AD_REWARD_LIMITS, AD_TXN_DEDUP_TTL } from '@src/membership/membership.constants';

@Injectable()
export class AdRewardService {
	private readonly logger = new Logger(AdRewardService.name);
	private readonly GOOGLE_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
	private cachedKeys: Map<string, { pem: string; fetchedAt: number }> = new Map();
	private readonly KEY_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

	constructor(
		@Inject(CACHE_MANAGER) private cacheManager: Cache,
		@InjectModel(AdRewardLog.name) private adRewardLogModel: Model<AdRewardLog>,
		private throttleService: ThrottleService,
		private httpService: HttpService,
		private configService: ConfigService
	) {}

	// 광고 시청 전 custom_data 발급
	async getCustomData(userId: string, feature: AdRewardFeature): Promise<string> {
		const maxBonus = this.getMaxBonus(feature);
		const currentBonus = await this.throttleService.getBonusCount(userId, feature);

		if (currentBonus >= maxBonus) {
			throw new BadRequestException(`오늘의 광고 보상 한도(${maxBonus}회)에 도달했습니다.`);
		}

		return JSON.stringify({ userId, feature });
	}

	// SSV 웹훅 처리
	async verifyAndReward(params: AdmobSsvParams, rawQuery: string): Promise<{ success: boolean }> {
		// 1. SSV 서명 검증
		const ssvEnabled =
			process.env.NODE_ENV === 'production' ||
			this.configService.get('ADMOB_SSV_VERIFICATION_ENABLED') !== 'false';
		if (ssvEnabled) {
			const isValid = await this.verifySsvSignature(params, rawQuery);
			if (!isValid) {
				throw new UnauthorizedException('Invalid SSV signature');
			}
		}

		// 2. custom_data 파싱
		let customData: { userId: string; feature: string };
		try {
			customData = JSON.parse(params.custom_data);
		} catch {
			throw new BadRequestException('Invalid custom_data');
		}

		const { userId, feature } = customData;

		// 3. 트랜잭션 중복 체크
		const txnKey = `ad_txn:${params.transaction_id}`;
		const existing = await this.cacheManager.get(txnKey);
		if (existing) {
			return { success: true }; // 멱등: 이미 처리됨
		}

		// 4. 보너스 증가
		const maxBonus = this.getMaxBonus(feature);
		const granted = await this.throttleService.incrementBonus(userId, feature, maxBonus);

		// 5. 트랜잭션 처리 완료 마킹
		const store = this.cacheManager.store as any;
		const client = store.getClient();
		const setexAsync = promisify(client.setex).bind(client);
		await setexAsync(txnKey, AD_TXN_DEDUP_TTL, '1');

		// 6. MongoDB 로그 (fire-and-forget)
		this.adRewardLogModel
			.create({
				userId,
				feature,
				transactionId: params.transaction_id,
				adNetwork: params.ad_network,
				adUnit: params.ad_unit,
				rewardAmount: parseInt(params.reward_amount) || 1,
				verified: ssvEnabled
			})
			.catch(err => {
				this.logger.error('Failed to log ad reward', err);
			});

		return { success: granted };
	}

	// 보너스 현황 조회
	async getBonusStatus(
		userId: string,
		feature: string
	): Promise<{
		currentBonus: number;
		maxBonus: number;
		remainingAds: number;
	}> {
		const currentBonus = await this.throttleService.getBonusCount(userId, feature);
		const maxBonus = this.getMaxBonus(feature);
		return {
			currentBonus,
			maxBonus,
			remainingAds: Math.max(0, maxBonus - currentBonus)
		};
	}

	// AdMob ECDSA 서명 검증 (원본 querystring 사용)
	private async verifySsvSignature(params: AdmobSsvParams, rawQuery: string): Promise<boolean> {
		try {
			const publicKeyPem = await this.getGooglePublicKey(params.key_id);
			if (!publicKeyPem) return false;

			// 서명 대상: &signature= 이전의 원본 쿼리스트링
			const sigIndex = rawQuery.indexOf('&signature=');
			if (sigIndex === -1) return false;
			const message = rawQuery.substring(0, sigIndex);

			const verifier = crypto.createVerify('SHA256');
			verifier.update(message);
			return verifier.verify(publicKeyPem, params.signature, 'base64');
		} catch (err) {
			this.logger.error('SSV signature verification failed', err);
			return false;
		}
	}

	// Google 공개키 조회 (24h 인메모리 캐시)
	private async getGooglePublicKey(keyId: string): Promise<string | null> {
		const cached = this.cachedKeys.get(keyId);
		if (cached && Date.now() - cached.fetchedAt < this.KEY_CACHE_TTL) {
			return cached.pem;
		}

		try {
			const response = await firstValueFrom(this.httpService.get(this.GOOGLE_KEYS_URL));
			const keys = response.data.keys || [];
			for (const k of keys) {
				this.cachedKeys.set(String(k.keyId), {
					pem: k.pem || k.base64,
					fetchedAt: Date.now()
				});
			}
			return this.cachedKeys.get(keyId)?.pem || null;
		} catch (err) {
			this.logger.error('Failed to fetch Google public keys', err);
			return null;
		}
	}

	private getMaxBonus(feature: string): number {
		const key = feature.toUpperCase() as keyof typeof AD_REWARD_LIMITS;
		return AD_REWARD_LIMITS[key] ?? 0;
	}
}
