import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

export enum MembershipType {
	COUPON = 'coupon',
	SUBSCRIPTION = 'subscription',
	ONE_TIME = 'one_time'
}

@Schema(options)
export class UserMembership extends Document {
	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	userId: mongoose.Types.ObjectId;

	@Prop({
		required: true,
		enum: MembershipType,
		default: MembershipType.COUPON
	})
	membershipType: MembershipType;

	@Prop({
		required: true,
		default: true
	})
	isActive: boolean;

	@Prop({
		required: true,
		type: Date
	})
	startDate: Date;

	@Prop({
		required: true,
		type: Date
	})
	endDate: Date;

	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Coupon'
	})
	couponId?: mongoose.Types.ObjectId;

	@Prop({
		type: String
	})
	storeTransactionId?: string; // 향후 결제 연동용

	@Prop({
		type: String
	})
	originalTransactionId?: string; // 향후 구독 연동용

	createdAt?: Date;
	updatedAt?: Date;

	readonly readOnlyData: {
		id: string;
		userId: string;
		membershipType: MembershipType;
		isActive: boolean;
		startDate: Date;
		endDate: Date;
		couponId?: string;
		storeTransactionId?: string;
		originalTransactionId?: string;
		createdAt: Date;
		updatedAt: Date;
	};
}

export const UserMembershipSchema = SchemaFactory.createForClass(UserMembership);

UserMembershipSchema.virtual('readOnlyData').get(function (this: UserMembership) {
	return {
		id: this._id,
		userId: this.userId,
		membershipType: this.membershipType,
		isActive: this.isActive,
		startDate: this.startDate,
		endDate: this.endDate,
		couponId: this.couponId,
		storeTransactionId: this.storeTransactionId,
		originalTransactionId: this.originalTransactionId,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt
	};
});

UserMembershipSchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true
});

UserMembershipSchema.virtual('coupon', {
	ref: 'Coupon',
	localField: 'couponId',
	foreignField: '_id',
	justOne: true
});

UserMembershipSchema.index({ userId: 1, isActive: 1 });
UserMembershipSchema.index({ startDate: 1, endDate: 1 });
UserMembershipSchema.index({ membershipType: 1 });
