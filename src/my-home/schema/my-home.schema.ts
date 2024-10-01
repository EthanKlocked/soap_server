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
	YOUTUBE = 'youtube',
	BOOK = 'book'
}

export type RatingType = 0 | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5;

type MovieContent = {
	imageUrl?: string;
	title: string;
	director: string;
	releaseDate: string;
	actors: string[];
	story: string;
	genre: string;
	rating: RatingType;
};

type MusicContent = {
	imageUrl?: string;
	title: string;
	artist: string;
};

type YoutubeContent = {
	title: string;
	channelName: string;
	url: string;
	publishedAt: string;
	thumbnailUrl?: string;
};

type BookContent = {
	imageUrl?: string;
	title: string;
	author: string;
	publisher: string;
	releaseDate: string;
	story: string;
	rating: RatingType;
};

export type ContentType = MovieContent | MusicContent | YoutubeContent | BookContent;

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
		type: mongoose.Schema.Types.Mixed,
		required: true
	})
	content: ContentType;

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
