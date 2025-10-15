import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { DiaryController } from '@src/diary/diary.controller';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';
import { Diary, DiarySchema } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis, DiaryAnalysisSchema } from '@src/diary/schema/diaryAnalysis.schema';
import { DiaryReport, DiaryReportSchema } from '@src/diary/schema/diaryReport.schema';
import { Friendship, FriendshipSchema } from '@src/friend/schema/friendship.schema';
import { UserModule } from '@src/user/user.module';
import { FileManagerModule } from '@src/file-manager/file-manager.module';
import { MembershipModule } from '@src/membership/membership.module';
import { ThrottleModule } from '@src/throttle/throttle.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Diary.name, schema: DiarySchema },
			{ name: DiaryAnalysis.name, schema: DiaryAnalysisSchema },
			{ name: DiaryReport.name, schema: DiaryReportSchema },
			{ name: Friendship.name, schema: FriendshipSchema }
		]),
		HttpModule,
		UserModule,
		FileManagerModule,
		MembershipModule,
		ThrottleModule
	],
	controllers: [DiaryController],
	providers: [DiaryService, DiaryAnalysisService],
	exports: [DiaryService, DiaryAnalysisService]
})
export class DiaryModule {}
