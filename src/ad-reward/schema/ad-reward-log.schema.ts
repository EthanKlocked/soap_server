import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class AdRewardLog extends Document {
	@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
	userId: mongoose.Types.ObjectId;

	@Prop({ required: true })
	feature: string;

	@Prop({ required: true, unique: true })
	transactionId: string;

	@Prop({ required: true })
	adNetwork: string;

	@Prop({ required: true })
	adUnit: string;

	@Prop({ type: Number, default: 1 })
	rewardAmount: number;

	@Prop({ type: Boolean, default: true })
	verified: boolean;

	createdAt?: Date;
	updatedAt?: Date;

	readonly readOnlyData: {
		id: string;
		userId: string;
		feature: string;
		transactionId: string;
		adNetwork: string;
		adUnit: string;
		rewardAmount: number;
		verified: boolean;
		createdAt: Date;
	};
}

export const AdRewardLogSchema = SchemaFactory.createForClass(AdRewardLog);

AdRewardLogSchema.virtual('readOnlyData').get(function (this: AdRewardLog) {
	return {
		id: this._id,
		userId: this.userId,
		feature: this.feature,
		transactionId: this.transactionId,
		adNetwork: this.adNetwork,
		adUnit: this.adUnit,
		rewardAmount: this.rewardAmount,
		verified: this.verified,
		createdAt: this.createdAt
	};
});

AdRewardLogSchema.index({ userId: 1, feature: 1 });
AdRewardLogSchema.index({ transactionId: 1 }, { unique: true });
AdRewardLogSchema.index({ createdAt: 1 });
