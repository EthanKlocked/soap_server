import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document, SchemaOptions } from 'mongoose';
import { Types } from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class Friendship extends Document {
	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	user1Id: Types.ObjectId;

	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	user2Id: Types.ObjectId;
}

export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

FriendshipSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
