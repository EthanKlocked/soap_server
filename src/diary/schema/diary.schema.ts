import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class Diary extends Document {
	@Prop({
		required: true,
		trim: true,
		maxlength: 65
	})
	title: string;

	@Prop({
		required: true,
		type: Date
	})
	date: Date;

	@Prop({
		required: true,
		maxlength: 2000
	})
	content: string;

	@Prop({
		type: [String],
		validate: [
			{ validator: (val: string[]) => val.length <= 5, message: 'Maximum 5 images allowed' },
			{
				validator: (val: string[]) => val.every(img => img.length <= 5 * 1024 * 1024),
				message: 'Each image must be 5MB or less'
			}
		]
	})
	imageBox: string[];

	@Prop({
		required: true,
		type: Number,
		min: 1,
		max: 5
	})
	coreEmotion: number;

	@Prop({
		type: [String],
		validate: [{ validator: (val: string[]) => val.length <= 12 }]
	})
	detailedEmotions: string[];

	@Prop({
		type: Boolean,
		default: true
	})
	isPublic: boolean;

	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	userId: mongoose.Types.ObjectId;

	readonly readOnlyData: {
		id: string;
		title: string;
		date: Date;
		content: string;
		coreEmotion: number;
		imageBox: string[];
		detailedEmotions: string[];
		isPublic: boolean;
	};
}

export const DiarySchema = SchemaFactory.createForClass(Diary);

DiarySchema.virtual('readOnlyData').get(function (this: Diary) {
	return {
		id: this._id,
		title: this.title,
		date: this.date,
		content: this.content,
		imageBox: this.imageBox,
		coreEmotion: this.coreEmotion,
		detailedEmotions: this.detailedEmotions,
		isPublic: this.isPublic
	};
});

DiarySchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true
});

DiarySchema.index({ userId: 1, date: -1 });
