import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
class Item {
	@Prop({ required: true })
	name: string;

	@Prop({ required: true, type: Number })
	x: number;

	@Prop({ required: true, type: Number })
	y: number;

	@Prop({ required: true, type: Number })
	zIndex: number;

	@Prop({ required: true, type: Boolean, default: true })
	visible: boolean;

	@Prop({ required: true, type: String })
	type: 'hobby' | 'interior';
}

@Schema(options)
export class Room extends Document {
	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	userId: mongoose.Types.ObjectId;

	@Prop({ type: [Item], default: [] })
	items: Item[];

	readonly readOnlyData: {
		id: string;
		name: string;
	};
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.virtual('readOnlyData').get(function (this: Room) {
	return {
		id: this._id
	};
});

RoomSchema.index({ userId: 1 });
