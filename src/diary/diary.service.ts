import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	HttpException,
	ConflictException,
	Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from '@src/diary/dto/diary.update.dto';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryReport } from '@src/diary/schema/diaryReport.schema';
import { DiaryReportDto } from '@src/diary/dto/diary.report.dto';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { SortOption, DiaryFindOption } from '@src/types/query.type';
import { HttpService } from '@nestjs/axios';
import { DiaryAnalysis } from '@src/diary/schema/diaryAnalysis.schema';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ReactionType } from '@src/diary/diary.interface';
import { FileManagerService } from '@src/file-manager/file-manager.service';

@Injectable()
export class DiaryService {
	private readonly logger = new Logger(DiaryService.name);
	private readonly aiServiceUrl: string;
	private readonly apiSecret: string; // secret key for using ai service

	constructor(
		@InjectModel(Diary.name) private diaryModel: Model<Diary>,
		@InjectModel(DiaryAnalysis.name) private diaryAnalysisModel: Model<DiaryAnalysis>,
		@InjectModel(DiaryReport.name) private diaryReportModel: Model<DiaryReport>,
		private readonly httpService: HttpService,
		private configService: ConfigService,
		private readonly fileManagerService: FileManagerService
	) {
		const aiServiceHost = this.configService.get<string>('AI_SERVICE_HOST_CUSTOM', 'localhost');
		const aiServicePort = this.configService.get<number>('AI_SERVICE_PORT_CUSTOM', 3000);
		this.aiServiceUrl = `http://${aiServiceHost}:${aiServicePort}`;
		this.apiSecret = this.configService.get<string>('API_SECRET');
	}

	async create(userId: string, body: DiaryCreateDto): Promise<Diary> {
		try {
			const { analysisResult, maskedContent } = await this.analyzeDiaryMetadata(body.content);
			const createdDiary = await this.diaryModel.create({
				...body,
				content: maskedContent,
				userId: userId
			});
			await this.diaryAnalysisModel.create({
				diaryId: createdDiary._id,
				userId,
				...analysisResult
			});
			return createdDiary;
		} catch (e) {
			this.logger.error('Failed to create diary', e);
			throw new InternalServerErrorException(
				'An unexpected error occurred while creating the diary'
			);
		}
	}

	async findAll(
		userId: string,
		query: DiaryFindDto
	): Promise<{ items: Diary[]; total: number; page: number; limit: number }> {
		try {
			const { year, month, page, limit, isPublic } = query;
			const findOption: DiaryFindOption = { userId: userId };
			const sortOption: SortOption = { date: -1 };

			if (year && month) {
				const startDate = new Date(year, month - 1, 1);
				const endDate = new Date(year, month, 0);
				findOption.date = { $gte: startDate, $lte: endDate };
				sortOption.date = 1;
			}

			if (isPublic !== undefined) {
				findOption.isPublic = isPublic;
			}

			const skip = (page - 1) * limit;
			const [items, total] = await Promise.all([
				this.diaryModel.find(findOption).sort(sortOption).skip(skip).limit(limit).exec(),
				this.diaryModel.countDocuments(findOption).exec()
			]);
			return { items, total, page, limit };
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async findOne(id: string): Promise<Diary> {
		try {
			const diary = await this.diaryModel.findOne({ _id: id }).exec();
			return diary;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async update(userId: string, id: string, body: DiaryUpdateDto) {
		try {
			const updateFields: Partial<DiaryUpdateDto> = { ...body };
			const originalDiary = await this.diaryModel.findOne({ _id: id, userId: userId }).exec();
			if (!originalDiary) {
				throw new NotFoundException(
					'Diary not found or you do not have permission to update it'
				);
			}
			if (updateFields.content && updateFields.content !== originalDiary.content) {
				const { analysisResult, maskedContent } = await this.analyzeDiaryMetadata(
					updateFields.content
				);
				updateFields.content = maskedContent;
				await this.diaryAnalysisModel.findOneAndUpdate(
					{ diaryId: id },
					{
						$set: {
							...analysisResult,
							userId
						}
					},
					{ upsert: true }
				);
			}
			const updatedDiary = await this.diaryModel
				.findOneAndUpdate(
					{ _id: id, userId: userId },
					{ $set: updateFields },
					{ new: true, runValidators: true }
				)
				.exec();
			return updatedDiary;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException(
				'An unexpected error occurred while updating the diary'
			);
		}
	}

	async delete(userId: string, id: string) {
		try {
			const result = await this.diaryModel
				.findOneAndDelete({ _id: id, userId: userId })
				.exec();
			if (!result)
				throw new NotFoundException(
					'Diary not found or you do not have permission to delete it'
				);
			if (result.imageBox && result.imageBox.length > 0) {
				await this.fileManagerService.deleteBulkFiles(result.imageBox).catch(error => {
					console.error('Failed to delete images:', error);
				});
			}
			await this.diaryAnalysisModel.findOneAndDelete({ diaryId: id }).exec();
			return result.readOnlyData;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	private async analyzeDiaryMetadata(
		content: string
	): Promise<{ analysisResult: any; maskedContent?: string }> {
		try {
			const headers = { Authorization: `Bearer ${this.apiSecret}` };
			const response = await firstValueFrom(
				this.httpService.post(
					`${this.aiServiceUrl}/ai/analyze_text`,
					{ text: content },
					{ headers }
				)
			);
			const analysisResult = response.data;
			return {
				analysisResult,
				maskedContent: content
				/* // CASE : MASKING CONTENT
				maskedContent: analysisResult.hasInappropriateContent
					? analysisResult.maskedContent
					: content
				*/
			};
		} catch (error) {
			console.error('Error during diary analysis:', error);
			return {
				analysisResult: {
					category: 'Personal',
					subcategories: [],
					primaryEmotion: null,
					secondaryEmotion: null,
					keywords: [],
					tone: null,
					timeFocus: null,
					confidenceScore: 0,
					isAnalyzed: false,
					hasInappropriateContent: false
				},
				maskedContent: content
			};
		}
	}

	async toggleReaction(
		userId: string,
		diaryId: string,
		reactionType: ReactionType
	): Promise<Diary> {
		try {
			const diary = await this.diaryModel.findById(diaryId);
			if (!diary) {
				throw new NotFoundException('Diary not found');
			}

			const reactionArray = diary.reactions[reactionType];
			const userIndex = reactionArray.indexOf(userId);

			if (userIndex > -1) {
				// User has already reacted, so remove the reaction
				reactionArray.splice(userIndex, 1);
			} else {
				// Clear reaction of user (must be one) - To allow multiple reactions per user, comment out the block below
				for (const key in diary.reactions) {
					const otherReactionArray = diary.reactions[key];
					const previousIndex = otherReactionArray.indexOf(userId);
					if (previousIndex > -1) {
						otherReactionArray.splice(previousIndex, 1);
						break;
					}
				}
				// User hasn't reacted, so add the reaction
				reactionArray.push(userId);
			}
			diary.markModified('reactions');

			await diary.save();
			return diary;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getMonthlyEmotionStats(userId: string, year: number, month: number) {
		try {
			const startDate = new Date(year, month - 1, 1);
			const endDate = new Date(year, month, 0);

			const diaries = await this.diaryModel
				.find({
					userId,
					date: {
						$gte: startDate,
						$lte: endDate
					}
				})
				.exec();

			const coreEmotionTotals = diaries.reduce(
				(acc, diary) => {
					acc[diary.coreEmotion] = (acc[diary.coreEmotion] || 0) + 1;
					return acc;
				},
				{} as { [key: number]: number }
			);

			const dailyEmotions = [];
			for (let i = 1; i <= endDate.getDate(); i++) {
				const dayDiaries = diaries.filter(diary => new Date(diary.date).getDate() === i);

				const dayEmotions = dayDiaries.reduce(
					(acc, diary) => {
						acc[diary.coreEmotion] = (acc[diary.coreEmotion] || 0) + 1;
						return acc;
					},
					{} as { [key: number]: number }
				);

				dailyEmotions.push({
					date: i,
					emotions: dayEmotions
				});
			}

			const detailedEmotionTotals = diaries.reduce(
				(acc, diary) => {
					diary.detailedEmotions.forEach(emotion => {
						acc[emotion] = (acc[emotion] || 0) + 1;
					});
					return acc;
				},
				{} as { [key: string]: number }
			);

			return {
				totalCoreEmotions: coreEmotionTotals,
				dailyEmotions: dailyEmotions,
				totalDetailedEmotions: detailedEmotionTotals
			};
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	//for checking meta temporarily
	async findAllMeta() {
		try {
			const metas = await this.diaryAnalysisModel.find().exec();
			return metas;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async createReport(
		reporterId: string,
		diaryId: string,
		reportDto: DiaryReportDto
	): Promise<DiaryReport> {
		try {
			const diary = await this.diaryModel.findById(diaryId);
			if (!diary) throw new NotFoundException('Diary not found');
			if (diary.userId.toString() === reporterId)
				throw new ConflictException('Cannot report your own diary');
			const existingReport = await this.diaryReportModel.findOne({
				diaryId,
				reporterId
			});
			if (existingReport) throw new ConflictException('You have already reported this diary');
			const report = await this.diaryReportModel.create({
				diaryId,
				reporterId,
				reason: reportDto.reason,
				description: reportDto.description
			});
			return report;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}
}
