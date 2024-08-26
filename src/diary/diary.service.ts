import {
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    HttpException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from './dto/diary.update.dto';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { SortOption, DiaryFindOption } from '@src/types/query.type';


@Injectable()
export class DiaryService {
    constructor(@InjectModel(Diary.name) private diaryModel: Model<Diary>) {}

    async create(
        userId: string,
        body: DiaryCreateDto,
    ): Promise<DiaryCreateDto> {
        try {
            const createdDiary = await this.diaryModel.create({
                ...body,
                userId: userId,
            });
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

    async update(userId: string, id: string, body: DiaryUpdateDto) {
        try {
            const updatedDiary = await this.diaryModel
                .findOneAndUpdate(
                    { _id: id, userId: userId },
                    { $set: body }, 
                    { new: true, runValidators: true }
                )
                .exec();
            if (!updatedDiary) throw new NotFoundException('Diary not found or you do not have permission to update it');
            return updatedDiary;
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }

    async delete(userId: string, id: string, ) {
        try {
            const result = await this.diaryModel.findOneAndDelete({ _id: id, userId: userId }).exec();
            if (!result) throw new NotFoundException('Diary not found or you do not have permission to delete it');
            return result.readOnlyData;
        } catch (e) {
            if (e instanceof HttpException) throw e;
            throw new InternalServerErrorException('An unexpected error occurred');
        }
    }
}