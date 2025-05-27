import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationSettingDocument = NotificationSetting & Document;

@Schema({ timestamps: true })
export class NotificationSetting {
	@Prop({ required: true, unique: true })
	userId: string;

	@Prop({ default: true })
	isEnabled: boolean;
}

export const NotificationSettingSchema = SchemaFactory.createForClass(NotificationSetting);
