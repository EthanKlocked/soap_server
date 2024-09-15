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
	id: string;

	@Prop({ required: true })
	name: string;

	@Prop({ required: true, type: Number })
	x: number;

	@Prop({ required: true, type: Number })
	y: number;

	@Prop({ type: Number, default: 0 })
	zIndex: number;

	@Prop({ required: true })
	imageUrl: string;
}

@Schema(options)
export class Room extends Document {
	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	userId: mongoose.Types.ObjectId;

	@Prop({ required: true })
	name: string;

	@Prop({ type: [Item], default: [] })
	items: Item[];

	@Prop({ type: String, default: null })
	wallpaper: string;

	readonly readOnlyData: {
		id: string;
		name: string;
	};
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.virtual('readOnlyData').get(function (this: Room) {
	return {
		id: this._id,
		name: this.name
	};
});

RoomSchema.index({ userId: 1 });
