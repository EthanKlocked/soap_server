import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaOptions } from 'mongoose';
import * as mongoose from 'mongoose';


const options: SchemaOptions = {
    timestamps: true,
    versionKey: false,
};


@Schema(options)
export class DiaryAnalysis extends Document {
    @Prop({ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Diary', 
        required: true 
    })
    diaryId: mongoose.Types.ObjectId;

    @Prop({ required: false })
    category?: string;

    @Prop({ type: [String], required: false })
    subcategories?: string[];

    @Prop({ required: false })
    primaryEmotion?: string;

    @Prop({ required: false })
    secondaryEmotion?: string;

    @Prop({ type: [String], required: false })
    keywords?: string[];

    @Prop({ required: false })
    tone?: string;

    @Prop({ required: false })
    timeFocus?: string;

    @Prop({ required: false, min: 0, max: 100 })
    confidenceScore?: number;

    @Prop({ required: false })
    isAnalyzed?: boolean;
}

export const DiaryAnalysisSchema = SchemaFactory.createForClass(DiaryAnalysis);

// Indexes for efficient querying
DiaryAnalysisSchema.index({ diaryId: 1 }, { unique: true });
DiaryAnalysisSchema.index({ category: 1, subcategories: 1 });
DiaryAnalysisSchema.index({ primaryEmotion: 1, secondaryEmotion: 1 });
DiaryAnalysisSchema.index({ keywords: 1 });
DiaryAnalysisSchema.index({ tone: 1 });
DiaryAnalysisSchema.index({ timeFocus: 1 });
DiaryAnalysisSchema.index({ confidenceScore: 1 });