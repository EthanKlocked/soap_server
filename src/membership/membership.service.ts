import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserMembership, MembershipType } from './schema/user-membership.schema';

@Injectable()
export class MembershipService {
	constructor(
		@InjectModel(UserMembership.name) private userMembershipModel: Model<UserMembership>
	) {}

	/**
	 * 사용자의 활성 멤버십 여부 확인
	 */
	async hasMembership(userId: string): Promise<boolean> {
		const now = new Date();
		const activeMembership = await this.userMembershipModel.findOne({
			userId,
			isActive: true,
			startDate: { $lte: now },
			endDate: { $gte: now }
		});
		return !!activeMembership;
	}

	/**
	 * 사용자의 현재 활성 멤버십 정보 조회
	 */
	async getCurrentMembership(userId: string): Promise<UserMembership | null> {
		const now = new Date();
		return await this.userMembershipModel
			.findOne({
				userId,
				isActive: true,
				startDate: { $lte: now },
				endDate: { $gte: now }
			})
			.sort({ endDate: -1 }) // 가장 늦게 만료되는 것
			.populate('coupon')
			.exec();
	}

	/**
	 * 사용자의 모든 멤버십 이력 조회
	 */
	async getMembershipHistory(userId: string): Promise<UserMembership[]> {
		return await this.userMembershipModel
			.find({ userId })
			.sort({ createdAt: -1 })
			.populate('coupon')
			.exec();
	}

	/**
	 * 쿠폰으로 멤버십 생성
	 */
	async createMembershipFromCoupon(
		userId: string,
		couponId: string,
		couponExpiredDate: Date,
		membershipDuration?: number
	): Promise<UserMembership> {
		const startDate = new Date();
		const endDate = membershipDuration
			? new Date(startDate.getTime() + membershipDuration * 24 * 60 * 60 * 1000)
			: couponExpiredDate;

		const membership = new this.userMembershipModel({
			userId,
			membershipType: MembershipType.COUPON,
			isActive: true,
			startDate,
			endDate,
			couponId
		});

		return await membership.save();
	}

	/**
	 * 멤버십 비활성화 (환불/취소 시 사용)
	 */
	async deactivateMembership(membershipId: string): Promise<UserMembership | null> {
		return await this.userMembershipModel.findByIdAndUpdate(
			membershipId,
			{ isActive: false },
			{ new: true }
		);
	}

	/**
	 * 만료된 멤버십들을 비활성화 (배치 작업용)
	 */
	async deactivateExpiredMemberships(): Promise<number> {
		const now = new Date();
		const result = await this.userMembershipModel.updateMany(
			{
				isActive: true,
				endDate: { $lt: now }
			},
			{ isActive: false }
		);
		return result.modifiedCount;
	}

	/**
	 * 특정 기능에 대한 멤버십 체크 (향후 기능별 제한 구현 시 사용)
	 */
	async checkFeatureAccess(userId: string, featureType: string): Promise<boolean> {
		// 기본적으로 멤버십이 있으면 모든 기능 사용 가능
		// 향후 기능별 세부 제한 로직 추가 가능
		return await this.hasMembership(userId);
	}
}
