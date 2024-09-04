import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { Diary, DiarySchema } from './schema/diary.schema';
import { DiaryAnalysis, DiaryAnalysisSchema } from './schema/diaryAnalysis.schema';


@Module({
    imports: [
		  MongooseModule.forFeature([
        { name: Diary.name, schema: DiarySchema },
        { name: DiaryAnalysis.name, schema: DiaryAnalysisSchema }
      ]),
      HttpModule
    ],
    controllers: [DiaryController],
    providers: [DiaryService]
})
export class DiaryModule {}