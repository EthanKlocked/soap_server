import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    HttpException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from './dto/diary.update.dto';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { SortOption, DiaryFindOption } from '@src/types/query.type';
import { HttpService } from '@nestjs/axios';
import { DiaryAnalysis } from '@src/diary/schema/diaryAnalysis.schema';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class DiaryService {
    private readonly aiServiceUrl: string;
    private readonly apiSecret: string; // secret key for using ai service

    constructor(
        @InjectModel(Diary.name) private diaryModel: Model<Diary>,
        @InjectModel(DiaryAnalysis.name) private diaryAnalysisModel: Model<DiaryAnalysis>,
        private readonly httpService: HttpService,
        private configService: ConfigService
    ) {
        //this.aiServiceUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:3005';
        this.aiServiceUrl = 'http://localhost:3005';
        this.apiSecret = this.configService.get<string>("API_SECRET")
    }

    async create(
        userId: string,
        body: DiaryCreateDto,
    ): Promise<DiaryCreateDto> {
        try {
            //create
            const createdDiary = await this.diaryModel.create({
                ...body,
                userId: userId,
            });
            //external ai service (fire and forget)
            this.analyzeAndSaveDiaryMetadata(createdDiary._id, body.content).catch(error => {
                console.error('Failed to analyze diary:', error);
            });
            //instantly return
            return createdDiary.readOnlyData;            
        } catch (e) {
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async findAll(
        userId: string,
        query: DiaryFindDto
    ): Promise<{ items: Diary[]; total: number; page: number; limit: number }> {
        try {
            const { year, month, page, limit } = query;
            const findOption : DiaryFindOption = {userId: userId}
            const sortOption : SortOption = {date: -1}
            if (year && month){
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0);
                findOption.date = { $gte: startDate, $lte: endDate }
                sortOption.date = 1
            }
            const skip = (page - 1) * limit;
            const [items, total] = await Promise.all([
                this.diaryModel
                    .find(findOption)
                    .sort(sortOption)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.diaryModel.countDocuments(findOption).exec(),
            ]);
            return { items, total, page, limit };
        } catch (e) {
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
    
    async findOne(userId: string, id: string): Promise<Diary> {
        try {
            const diary = await this.diaryModel
                .findOne({ _id: id, userId: userId })
                .exec();
            return diary;
        } catch (e) {
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async update(userId: string, id: string, body: DiaryUpdateDto) { //일기 내용 갱신 시 메타데이터 수정여부... 파악 후 기능추가 필요.....
        try {
            //original chk
            const originalDiary = await this.diaryModel.findOne({ _id: id, userId: userId }).exec();
            if (!originalDiary) {
                throw new NotFoundException('Diary not found or you do not have permission to update it');
            }
            //update diary
            const updatedDiary = await this.diaryModel
                .findOneAndUpdate(
                    { _id: id, userId: userId },
                    { $set: body }, 
                    { new: true, runValidators: true }
                )
                .exec();
            //update metadata (only case content changed)
            if (body.content && body.content !== originalDiary.content) {
                this.analyzeAndSaveDiaryMetadata(id, body.content).catch(error => {
                    console.error('Failed to update diary metadata:', error);
                });
            }
            return updatedDiary;            
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async delete(userId: string, id: string) {
        try {
            //delete diary
            const result = await this.diaryModel.findOneAndDelete({ _id: id, userId: userId }).exec();
            if (!result) throw new NotFoundException('Diary not found or you do not have permission to delete it');
            //delete metas (optianal)
            this.diaryAnalysisModel.findOneAndDelete({ diaryId: id }).exec();
            return result.readOnlyData;
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    private async analyzeAndSaveDiaryMetadata(diaryId: string, content: string): Promise<void> {
        try {
            const headers = {'Authorization': `Bearer ${this.apiSecret}`};
            const response = await firstValueFrom(
                this.httpService.post(
                    `${this.aiServiceUrl}/ai/analyze_text`, 
                    { text: content },
                    { headers }
                )
            );
            const analysisResult = response.data;
            await this.diaryAnalysisModel.findOneAndUpdate(
                { diaryId },
                { $set: analysisResult },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error during diary analysis:', error);
        }
    }    

    //for checking meta temporarily
    async findAllMeta(){
        try{
            const metas = await this.diaryAnalysisModel.find().exec();
            return metas;
        }catch(e){
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }      
}