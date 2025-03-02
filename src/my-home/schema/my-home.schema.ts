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

export type MovieContent = {
	imageUrl?: string;
	title: string;
	director: string;
	releaseDate: string;
	actors: string[];
	story: string;
	genre: string;
	rating: RatingType;
};

export type MusicContent = {
	imageUrl?: string;
	title: string;
	artist: string;
};

export type YoutubeContent = {
	title: string;
	channelName: string;
	url: string;
	publishedAt: string;
	thumbnailUrl?: string;
};

export type BookContent = {
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
		required: false
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

// 기존 인덱스
MyHomeSchema.index({ userId: 1, date: -1 });

// 영화 중복 체크용 인덱스 (유저별로 같은 영화 추가 방지)
MyHomeSchema.index(
	{
		userId: 1,
		category: 1,
		'content.title': 1,
		'content.director': 1
	},
	{
		unique: true,
		partialFilterExpression: { category: CategoryType.MOVIE }
	}
);

// 음악 중복 체크용 인덱스
MyHomeSchema.index(
	{
		userId: 1,
		category: 1,
		'content.title': 1,
		'content.artist': 1
	},
	{
		unique: true,
		partialFilterExpression: { category: CategoryType.MUSIC }
	}
);

// 유튜브 중복 체크용 인덱스
MyHomeSchema.index(
	{
		userId: 1,
		category: 1,
		'content.url': 1
	},
	{
		unique: true,
		partialFilterExpression: { category: CategoryType.YOUTUBE }
	}
);

// 책 중복 체크용 인덱스
MyHomeSchema.index(
	{
		userId: 1,
		category: 1,
		'content.title': 1,
		'content.author': 1
	},
	{
		unique: true,
		partialFilterExpression: { category: CategoryType.BOOK }
	}
);
