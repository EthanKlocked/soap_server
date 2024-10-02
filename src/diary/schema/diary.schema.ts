import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

export enum ReactionType {
	Best = 'best',
	Funny = 'funny',
	Touching = 'touching',
	Good = 'good',
	Empathy = 'empathy',
	Sad = 'sad',
	Angry = 'angry',
	Amazing = 'amazing',
	Support = 'support',
	Cheer = 'cheer'
}

export type ReactionMap = {
	[key in ReactionType]: string[]; // Array of user ids for each reaction type
};

const defaultReactions: ReactionMap = {
	[ReactionType.Best]: [],
	[ReactionType.Funny]: [],
	[ReactionType.Touching]: [],
	[ReactionType.Good]: [],
	[ReactionType.Empathy]: [],
	[ReactionType.Sad]: [],
	[ReactionType.Angry]: [],
	[ReactionType.Amazing]: [],
	[ReactionType.Support]: [],
	[ReactionType.Cheer]: []
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
			{
				validator: (val: string[]) => val.length <= 5,
				message: 'Maximum 5 images allowed'
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

	@Prop({ type: Object, default: defaultReactions })
	reactions: ReactionMap;

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
		reactions: ReactionMap;
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
		isPublic: this.isPublic,
		reactions: this.reactions
	};
});

DiarySchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true
});

DiarySchema.index({ userId: 1, date: -1 });
