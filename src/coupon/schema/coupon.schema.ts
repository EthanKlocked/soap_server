import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class Coupon extends Document {
	@Prop({
		required: true,
		unique: true,
		trim: true,
		maxlength: 20
	})
	code: string;

	@Prop({
		required: true,
		default: false
	})
	isUsed: boolean;

	@Prop({
		required: true,
		type: Date
	})
	validUntil: Date;

	@Prop({
		required: true,
		type: Date
	})
	expiredDate: Date;

	@Prop({
		type: Number,
		min: 1
	})
	membershipDuration?: number; // 일 단위, 선택사항 (우선 적용)

	@Prop({
		type: String,
		maxlength: 200
	})
	description?: string;

	createdAt?: Date;
	updatedAt?: Date;

	readonly readOnlyData: {
		id: string;
		code: string;
		isUsed: boolean;
		validUntil: Date;
		expiredDate: Date;
		membershipDuration?: number;
		description?: string;
		createdAt: Date;
		updatedAt: Date;
	};
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

CouponSchema.virtual('readOnlyData').get(function (this: Coupon) {
	return {
		id: this._id,
		code: this.code,
		isUsed: this.isUsed,
		validUntil: this.validUntil,
		expiredDate: this.expiredDate,
		membershipDuration: this.membershipDuration,
		description: this.description,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt
	};
});

CouponSchema.index({ code: 1 });
CouponSchema.index({ validUntil: 1 });
CouponSchema.index({ isUsed: 1 });
