import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from './schema/coupon.schema';
import { CouponCreateDto } from './dto/coupon.create.dto';
import { CouponRegisterDto } from './dto/coupon.register.dto';
import { MembershipService } from '@src/membership/membership.service';
import * as crypto from 'crypto';

@Injectable()
export class CouponService {
	constructor(
		@InjectModel(Coupon.name) private couponModel: Model<Coupon>,
		private membershipService: MembershipService
	) {}

	private generateCouponCode(): string {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let result = '';
		const randomBytes = crypto.randomBytes(10);
		for (let i = 0; i < 12; i++) {
			result += chars[randomBytes[i % randomBytes.length] % chars.length];
		}
		return result.match(/.{1,4}/g)?.join('-') || result;
	}

	/**
	 * 유니크한 쿠폰 코드 생성 (중복 체크)
	 */
	private async generateUniqueCouponCode(maxRetries: number = 5): Promise<string> {
		for (let i = 0; i < maxRetries; i++) {
			const code = this.generateCouponCode();
			const existingCoupon = await this.couponModel.findOne({ code });
			if (!existingCoupon) {
				return code;
			}
		}
		throw new Error('유니크한 쿠폰 코드 생성에 실패했습니다.');
	}

	/**
	 * 쿠폰 생성 (관리자용)
	 */
	async create(couponCreateDto: CouponCreateDto): Promise<Coupon> {
		try {
			const now = new Date();
			// 유니크한 랜덤 코드 생성
			const code = await this.generateUniqueCouponCode();
			// 디폴트 날짜 설정
			const validUntil =
				couponCreateDto.validUntil || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1년 후
			const expiredDate =
				couponCreateDto.expiredDate || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1개월 후
			const couponData = {
				...couponCreateDto,
				code,
				validUntil,
				expiredDate
			};
			const coupon = new this.couponModel(couponData);
			return await coupon.save();
		} catch (error) {
			throw error;
		}
	}

	/**
	 * 쿠폰 등록 (사용자용)
	 */
	async register(
		userId: string,
		couponRegisterDto: CouponRegisterDto
	): Promise<{
		success: boolean;
		membership: any;
		message: string;
	}> {
		const { code } = couponRegisterDto;
		// 쿠폰 조회
		const coupon = await this.couponModel.findOne({ code });
		if (!coupon) {
			throw new NotFoundException('존재하지 않는 쿠폰 코드입니다.');
		}
		// 쿠폰 사용 여부 확인
		if (coupon.isUsed) {
			throw new BadRequestException('이미 사용된 쿠폰입니다.');
		}
		// 쿠폰 유효기간 확인
		const now = new Date();
		if (now > coupon.validUntil) {
			throw new BadRequestException('유효기간이 만료된 쿠폰입니다.');
		}
		// 사용자가 이미 활성 멤버십을 가지고 있는지 확인
		const hasMembership = await this.membershipService.hasMembership(userId);
		if (hasMembership) {
			throw new BadRequestException('이미 활성화된 멤버십이 있습니다.');
		}
		try {
			const membership = await this.membershipService.createMembershipFromCoupon(
				userId,
				coupon._id.toString(),
				coupon.expiredDate,
				coupon.membershipDuration
			);
			coupon.isUsed = true;
			await coupon.save();
			return {
				success: true,
				membership: membership.readOnlyData,
				message: '쿠폰이 성공적으로 등록되었습니다.'
			};
		} catch (error) {
			throw new BadRequestException('쿠폰 등록 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 쿠폰 조회 (관리자용)
	 */
	async findOne(code: string): Promise<Coupon> {
		const coupon = await this.couponModel.findOne({ code });
		if (!coupon) {
			throw new NotFoundException('존재하지 않는 쿠폰 코드입니다.');
		}
		return coupon;
	}

	/**
	 * 모든 쿠폰 조회 (관리자용)
	 */
	async findAll(): Promise<Coupon[]> {
		return await this.couponModel.find().sort({ createdAt: -1 });
	}

	/**
	 * 쿠폰 삭제 (관리자용)
	 */
	async remove(code: string): Promise<Coupon> {
		const coupon = await this.couponModel.findOneAndDelete({ code });
		if (!coupon) {
			throw new NotFoundException('존재하지 않는 쿠폰 코드입니다.');
		}
		return coupon;
	}
}
