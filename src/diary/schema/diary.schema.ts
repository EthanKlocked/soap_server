import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '@src/user/schema/user.schema';

export type DiaryDocument = Diary & Document;

const options: SchemaOptions = {
  timestamps: true,
  versionKey: false,
};

@Schema(options)
export class Diary extends Document {
  @Prop({
    required: true,
    trim: true,
    maxlength: 65,
  })
  title: string;

  @Prop({
    required: true,
    type: Date,
  })
  date: Date;

  @Prop({
    trim: true,
  })
  photo: string;

  @Prop({
    required: true,
    maxlength: 2000,
  })
  content: string;

  @Prop({
    required: true,
    type: Number,
    min: 1,
    max: 5,
  })
  coreEmotion: number;

  @Prop({
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 12'],
  })
  detailedEmotions: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  readonly readOnlyData: {
    id: string;
    title: string;
    date: Date;
    content: string;
    coreEmotion: number;
    detailedEmotions: string[];
  };
}

function arrayLimit(val) {
  return val.length <= 12;
}

export const DiarySchema = SchemaFactory.createForClass(Diary);

DiarySchema.virtual('readOnlyData').get(function (this: Diary) {
  return {
    id: this._id,
    title: this.title,
    date: this.date,
    coreEmotion: this.coreEmotion,
    detailedEmotions: this.detailedEmotions,
  };
});
