import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString, IsEnum, IsDate } from 'class-validator';
import { Document, SchemaOptions } from 'mongoose';
import { Types } from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class FriendRequest extends Document {
	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	senderId: Types.ObjectId;

	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	receiverId: Types.ObjectId;

	@Prop()
	@IsString()
	message: string;

	@Prop({
		required: true,
		enum: ['pending', 'accepted', 'rejected'],
		default: 'pending'
	})
	@IsEnum(['pending', 'accepted', 'rejected'])
	status: string;

	@Prop({ default: Date.now })
	@IsDate()
	lastRequestDate: Date;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index(
	{ senderId: 1, receiverId: 1 },
	{ unique: true, partialFilterExpression: { status: 'pending' } }
);
