import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';


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
        required: true,
        maxlength: 2000,
    })
    content: string;

    @Prop({
        trim: true,
    })
    imgUrl: string;

    @Prop({
        trim: true,
    })
    imgUrl1: string;

    @Prop({
        trim: true,
    })
    imgUrl2: string;    

    @Prop({
        required: true,
        type: Number,
        min: 1,
        max: 5,
    })
    coreEmotion: number;

    @Prop({
        type: [String],
        validate: [{validator: (val: string[]) => val.length <= 12}]
    })
    detailedEmotions: string[];

    @Prop({ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    })
    userId: mongoose.Types.ObjectId;

    readonly readOnlyData: {
        id: string,
        title: string,
        date: Date,
        content: string,
        coreEmotion: number,
        detailedEmotions: string[],
    };    
}


export const DiarySchema = SchemaFactory.createForClass(Diary);


DiarySchema.virtual('readOnlyData').get(function (this: Diary) {
    return {
        id: this._id,
        title: this.title,
        date: this.date,
        content: this.content,
        coreEmotion: this.coreEmotion,
        detailedEmotions: this.detailedEmotions,
    };
});


DiarySchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});


DiarySchema.index({ userId: 1, date: -1 });