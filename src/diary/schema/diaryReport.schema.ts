import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';

export enum DiaryReportReason {
	FALSE_INFO = 'FALSE_INFO',
	COMMERCIAL = 'COMMERCIAL',
	ADULT = 'ADULT',
	VIOLENCE = 'VIOLENCE',
	OTHER = 'OTHER'
}

export enum DiaryReportStatus {
	PENDING = 'PENDING',
	RESOLVED = 'RESOLVED'
}

const options: SchemaOptions = {
	timestamps: true,
	versionKey: false
};

@Schema(options)
export class DiaryReport extends Document {
	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Diary',
		required: true
	})
	diaryId: mongoose.Types.ObjectId;

	@Prop({
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	})
	reporterId: mongoose.Types.ObjectId;

	@Prop({
		type: String,
		enum: Object.values(DiaryReportReason),
		required: true
	})
	reason: DiaryReportReason;

	@Prop({
		type: String,
		required: false,
		validate: {
			validator: function (v: string) {
				return (
					this.reason !== DiaryReportReason.OTHER ||
					(this.reason === DiaryReportReason.OTHER && v)
				);
			},
			message: 'Description is required when reason is OTHER'
		}
	})
	description?: string;

	@Prop({
		type: String,
		enum: Object.values(DiaryReportStatus),
		default: DiaryReportStatus.PENDING
	})
	status: DiaryReportStatus;
}

export const DiaryReportSchema = SchemaFactory.createForClass(DiaryReport);

// Indexes
DiaryReportSchema.index({ diaryId: 1 });
DiaryReportSchema.index({ reporterId: 1 });
DiaryReportSchema.index({ status: 1 });
DiaryReportSchema.index({ createdAt: 1 });
