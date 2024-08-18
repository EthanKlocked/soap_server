import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { Diary, DiaryDocument } from './schema/diary.schema';

@Injectable()
export class DiaryService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<DiaryDocument>,
  ) {}

  async create(
    userId: string,
    createDiaryDto: CreateDiaryDto,
  ): Promise<CreateDiaryDto> {
    try {
      const createdDiary = new this.diaryModel({
        ...createDiaryDto,
        user: userId,
      });
      await createdDiary.save();
      return createdDiary.readOnlyData;
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: Diary[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        this.diaryModel
          .find({ user: userId })
          .sort({ date: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.diaryModel.countDocuments({ user: userId }).exec(),
      ]);
      return { items, total, page, limit };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  async findMonthly(
    userId: string,
    year: number,
    month: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Diary[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const [items, total] = await Promise.all([
        this.diaryModel
          .find({
            user: userId,
            date: { $gte: startDate, $lte: endDate },
          })
          .sort({ date: 1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.diaryModel
          .countDocuments({
            user: userId,
            date: { $gte: startDate, $lte: endDate },
          })
          .exec(),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (e) {
      throw new InternalServerErrorException(
        'Failed to fetch monthly diaries: ' + e.message,
      );
    }
  }

  async findOne(userId: string, id: string): Promise<Diary> {
    try {
      const diary = await this.diaryModel
        .findOne({ _id: id, user: userId })
        .exec();
      if (!diary) {
        throw new NotFoundException('Diary not found');
      }
      return diary;
    } catch (e) {
      if (e instanceof NotFoundException) {
        throw e;
      }
      throw new InternalServerErrorException(e.message);
    }
  }
}
