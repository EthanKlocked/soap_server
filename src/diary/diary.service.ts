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
import { ClientSession } from 'mongoose';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { ReactionType } from '@src/diary/diary.interface';

@Injectable()
export class DiaryService {
	private readonly aiServiceUrl: string;
	private readonly apiSecret: string; // secret key for using ai service
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly s3Region: string;
	private readonly isDevEnvironment: boolean;
	private readonly localImagePath: string;

	constructor(
		@InjectModel(Diary.name) private diaryModel: Model<Diary>,
		@InjectModel(DiaryAnalysis.name) private diaryAnalysisModel: Model<DiaryAnalysis>,
		private readonly httpService: HttpService,
		private configService: ConfigService
	) {
		const aiServiceHost = this.configService.get<string>('AI_SERVICE_HOST_CUSTOM', 'localhost');
		const aiServicePort = this.configService.get<number>('AI_SERVICE_PORT_CUSTOM', 3000);
		this.aiServiceUrl = `http://${aiServiceHost}:${aiServicePort}`;
		this.apiSecret = this.configService.get<string>('API_SECRET');
		this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
		this.s3Region = this.configService.get<string>('AWS_REGION', 'ap-northeast-2');
		this.s3Client = new S3Client({
			region: this.s3Region
		});
		this.isDevEnvironment = this.configService.get<string>('NODE_ENV') === 'dev';
		this.localImagePath = path.join(__dirname, '..', '..', 'uploads', 'images');
		if (this.isDevEnvironment && !fs.existsSync(this.localImagePath)) {
			fs.mkdirSync(this.localImagePath, { recursive: true });
		}
	}

	private async uploadImages(files: Express.Multer.File[]): Promise<string[]> {
		if (this.isDevEnvironment) {
			return this.uploadImagesToLocal(files);
		} else {
			return this.uploadImagesToS3(files);
		}
	}

	private async uploadImagesToLocal(files: Express.Multer.File[]): Promise<string[]> {
		const uploadPromises = files.map(async (file, index) => {
			const fileName = `${Date.now()}-${index}.${file.originalname.split('.').pop()}`;
			const filePath = path.join(this.localImagePath, fileName);

			await fs.promises.writeFile(filePath, file.buffer);

			return `/uploads/images/${fileName}`;
		});

		return Promise.all(uploadPromises);
	}

	private async uploadImagesToS3(files: Express.Multer.File[]): Promise<string[]> {
		const uploadPromises = files.map(async (file, index) => {
			const key = `diary/${Date.now()}-${index}.${file.originalname.split('.').pop()}`;

			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: file.buffer,
				ContentType: file.mimetype
			});

			await this.s3Client.send(command);

			return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}`;
		});

		return Promise.all(uploadPromises);
	}

	private async deleteImages(imageUrls: string[]): Promise<void> {
		if (this.isDevEnvironment) {
			await this.deleteImagesFromLocal(imageUrls);
		} else {
			await this.deleteImagesFromS3(imageUrls);
		}
	}

	private async deleteImagesFromLocal(imageUrls: string[]): Promise<void> {
		for (const url of imageUrls) {
			const filePath = path.join(this.localImagePath, path.basename(url));
			if (fs.existsSync(filePath)) {
				await fs.promises.unlink(filePath);
			}
		}
	}

	private async deleteImagesFromS3(imageUrls: string[]): Promise<void> {
		for (const url of imageUrls) {
			const key = url.split('/').pop();
			if (key) {
				try {
					await this.s3Client.send(
						new DeleteObjectCommand({
							Bucket: this.bucketName,
							Key: key
						})
					);
				} catch (error) {
					console.error(`Failed to delete image from S3: ${key}`, error);
				}
			}
		}
	}

	async create(
		userId: string,
		body: DiaryCreateDto,
		files?: Express.Multer.File[]
	): Promise<Diary> {
		try {
			let imageUrls: string[] = [];
			if (files && files.length > 0) {
				imageUrls = await this.uploadImages(files);
			}

			const createdDiary = await this.diaryModel.create({
				...body,
				userId: userId,
				imageBox: imageUrls
			});

			this.analyzeAndSaveDiaryMetadata(userId, createdDiary._id, body.content).catch(
				error => {
					console.error('Failed to analyze diary:', error);
				}
			);

			return createdDiary;
		} catch (e) {
			console.log(e);
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

	async update(userId: string, id: string, body: DiaryUpdateDto, files?: Express.Multer.File[]) {
		try {
			const originalDiary = await this.diaryModel.findOne({ _id: id, userId: userId }).exec();
			if (!originalDiary) {
				throw new NotFoundException(
					'Diary not found or you do not have permission to update it'
				);
			}

			const updateFields: Partial<DiaryUpdateDto> = {};

			if (files && files.length > 0) {
				try {
					await this.deleteImages(originalDiary.imageBox);
					const newImageUrls = await this.uploadImages(files);
					updateFields.imageBox = newImageUrls; // 여기서 string[]을 저장
				} catch (error) {
					throw new InternalServerErrorException('Failed to process images');
				}
			}

			for (const [key, value] of Object.entries(body)) {
				if (key !== 'imageBox' && value !== undefined) {
					updateFields[key] = value;
				}
			}

			const updatedDiary = await this.diaryModel
				.findOneAndUpdate(
					{ _id: id, userId: userId },
					{ $set: updateFields },
					{ new: true, runValidators: true }
				)
				.exec();

			if (body.content && body.content !== originalDiary.content) {
				this.analyzeAndSaveDiaryMetadata(userId, id, body.content).catch(error => {
					console.error('Failed to update diary metadata:', error);
				});
			}

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
			//delete diary
			const result = await this.diaryModel
				.findOneAndDelete({ _id: id, userId: userId })
				.exec();
			if (!result)
				throw new NotFoundException(
					'Diary not found or you do not have permission to delete it'
				);
			// delete images
			if (result.imageBox && result.imageBox.length > 0) {
				await this.deleteImages(result.imageBox).catch(error => {
					console.error('Failed to delete images:', error);
				});
			}
			//delete metas (optianal)
			this.diaryAnalysisModel.findOneAndDelete({ diaryId: id }).exec();
			return result.readOnlyData;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	private async analyzeAndSaveDiaryMetadata(
		userId: string,
		diaryId: string,
		content: string
	): Promise<void> {
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
			await this.diaryAnalysisModel.findOneAndUpdate(
				{ diaryId },
				{
					$set: {
						...analysisResult,
						userId
					}
				},
				{ upsert: true, new: true }
			);
		} catch (error) {
			console.error('Error during diary analysis:', error);
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
}
