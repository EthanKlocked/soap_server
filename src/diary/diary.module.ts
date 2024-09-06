import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { DiaryController } from '@src/diary/diary.controller';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';
import { Diary, DiarySchema } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis, DiaryAnalysisSchema } from '@src/diary/schema/diaryAnalysis.schema';


@Module({
    imports: [
		MongooseModule.forFeature([
			{ name: Diary.name, schema: DiarySchema },
			{ name: DiaryAnalysis.name, schema: DiaryAnalysisSchema }
		]),
		HttpModule
    ],
    controllers: [DiaryController],
    providers: [DiaryService, DiaryAnalysisService],
  	exports: [DiaryService, DiaryAnalysisService]
})
export class DiaryModule {}