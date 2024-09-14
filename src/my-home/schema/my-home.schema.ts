import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

export enum CategoryType {
	MOVIE = 'movie',
	MUSIC = 'music',
	YOUTUBE = 'youtube'
}

@Schema(options)
export class MyHome extends Document {
	@Prop({
		required: true,
		trim: true,
		enum: CategoryType
	})
	category: CategoryType;

	@Prop({
		required: true
	})
	review: string;

	@Prop({
		type: Number,
		min: 0,
		max: 5,
		required: function (this: MyHome) {
			return this.category === 'movie';
		}
	})
	rating: number;

	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	userId: mongoose.Types.ObjectId;

	readonly readOnlyData: {
		id: string;
		category: CategoryType;
	};
}

export const MyHomeSchema = SchemaFactory.createForClass(MyHome);

MyHomeSchema.virtual('readOnlyData').get(function (this: MyHome) {
	return {
		id: this._id,
		category: this.category
	};
});

MyHomeSchema.virtual('user', {
	ref: 'User',
	localField: 'userId',
	foreignField: '_id',
	justOne: true
});

MyHomeSchema.index({ userId: 1, date: -1 });
