import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsNotEmpty } from 'class-validator';
import { Document, SchemaOptions } from 'mongoose';
import { Types } from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class BlockedUser extends Document {
	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	userId: Types.ObjectId;

	@Prop({
		type: Types.ObjectId,
		ref: 'User',
		required: true
	})
	@IsNotEmpty()
	blockedUserId: Types.ObjectId;
}

export const BlockedUserSchema = SchemaFactory.createForClass(BlockedUser);

BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
