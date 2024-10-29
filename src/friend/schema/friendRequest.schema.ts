import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty, IsString, IsEnum, IsDate } from 'class-validator';
import { Document, SchemaOptions } from 'mongoose';
import { Types } from 'mongoose';
import { FriendRequestStatus } from '@src/friend/friendship.interface';

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
		enum: [
			FriendRequestStatus.PENDING,
			FriendRequestStatus.ACCEPTED,
			FriendRequestStatus.REJECTED
		],
		default: FriendRequestStatus.PENDING
	})
	@IsEnum([
		FriendRequestStatus.PENDING,
		FriendRequestStatus.ACCEPTED,
		FriendRequestStatus.REJECTED
	])
	status: string;

	@Prop({ default: Date.now })
	@IsDate()
	lastRequestDate: Date;
}

export const FriendRequestSchema = SchemaFactory.createForClass(FriendRequest);

FriendRequestSchema.index(
	{ senderId: 1, receiverId: 1 },
	{ unique: true }
	//{ unique: true, partialFilterExpression: { status: FriendRequestStatus.PENDING } }
);
