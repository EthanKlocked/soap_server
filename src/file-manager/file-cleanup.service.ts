//신규 개발중...

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diary } from '@src/diary/schema/diary.schema';
import { FileManagerService } from './file-manager.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

@Injectable()
export class FileCleanupService {
	private readonly logger = new Logger(FileCleanupService.name);
	private readonly s3Client: S3Client;
	private readonly bucketName: string;

	constructor(
		@InjectModel(Diary.name) private diaryModel: Model<Diary>,
		private readonly fileManagerService: FileManagerService,
		private readonly configService: ConfigService
	) {
		this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
		this.s3Client = new S3Client({
			region: this.configService.get<string>('AWS_REGION', 'ap-northeast-2')
		});
	}

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async cleanupOrphanImages() {
		try {
			this.logger.log('Starting orphan image cleanup...');

			// 1. S3의 모든 이미지 목록 가져오기
			const allS3Images = await this.listAllS3Images();

			// 2. DB에서 사용 중인 이미지 목록 가져오기
			const usedImages = await this.getUsedImages();

			// 3. 고아 이미지 찾기 (24시간 이상 된 것만)
			const orphanImages = this.findOrphanImages(allS3Images, usedImages);

			// 4. 고아 이미지 삭제
			if (orphanImages.length > 0) {
				await this.fileManagerService.deleteBulkFiles(orphanImages);
				this.logger.log(`Deleted ${orphanImages.length} orphan images`);
			} else {
				this.logger.log('No orphan images found');
			}
		} catch (error) {
			this.logger.error('Error during orphan image cleanup:', error);
		}
	}

	private async listAllS3Images(): Promise<string[]> {
		const images: string[] = [];
		let continuationToken: string | undefined;

		do {
			const command = new ListObjectsV2Command({
				Bucket: this.bucketName,
				Prefix: 'diary/',
				ContinuationToken: continuationToken
			});

			const response = await this.s3Client.send(command);

			if (response.Contents) {
				const urls = response.Contents.map(
					obj => `https://${this.bucketName}.s3.ap-northeast-2.amazonaws.com/${obj.Key}`
				);
				images.push(...urls);
			}

			continuationToken = response.NextContinuationToken;
		} while (continuationToken);

		return images;
	}

	private async getUsedImages(): Promise<Set<string>> {
		const diaries = await this.diaryModel.find({}, { imageBox: 1 }).exec();
		const usedImages = new Set<string>();

		diaries.forEach(diary => {
			diary.imageBox?.forEach(url => usedImages.add(url));
		});

		return usedImages;
	}

	private findOrphanImages(allImages: string[], usedImages: Set<string>): string[] {
		const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

		return allImages.filter(imageUrl => {
			if (usedImages.has(imageUrl)) {
				return false;
			}

			// URL에서 타임스탬프 추출 (예: diary/1234567890-image.jpg)
			const match = imageUrl.match(/diary\/(\d+)-/);
			if (!match) return false;

			const timestamp = parseInt(match[1]);
			return timestamp < twentyFourHoursAgo;
		});
	}
}
