import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	S3Client,
	PutObjectCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	ObjectIdentifier
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUrlResponse } from '@src/file-manager/file-manager.interface';

@Injectable()
export class FileManagerService {
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly s3Region: string;

	constructor(private readonly configService: ConfigService) {
		this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
		this.s3Region = this.configService.get<string>('AWS_REGION', 'ap-northeast-2');
		this.s3Client = new S3Client({
			region: this.s3Region
		});
	}

	async generatePresignedUrl(fileName: string, fileType: string): Promise<PresignedUrlResponse> {
		const key = `diary/${Date.now()}-${fileName}`;
		const putObjectCommand = new PutObjectCommand({
			Bucket: this.bucketName,
			Key: key,
			ContentType: fileType
		});
		try {
			const presignedUrl = await getSignedUrl(this.s3Client, putObjectCommand, {
				expiresIn: 3600
			});
			return {
				presignedUrl,
				fileUrl: `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}`
			};
		} catch (error) {
			console.error('Error generating presigned URL:', error);
			throw new InternalServerErrorException('Failed to generate presigned URL');
		}
	}

	async deleteFile(fileUrl: string): Promise<void> {
		const key = fileUrl.split('.amazonaws.com/')[1];
		if (!key) throw new NotFoundException('Invalid file URL');
		try {
			await this.s3Client.send(
				new DeleteObjectCommand({
					Bucket: this.bucketName,
					Key: key
				})
			);
		} catch (error) {
			console.error(`Failed to delete file from S3: ${key}`, error);
			if (error.name === 'NoSuchKey') throw new NotFoundException('File not found');
			throw new InternalServerErrorException('Failed to delete file');
		}
	}

	async deleteBulkFiles(fileUrls: string[]): Promise<void> {
		const keys = fileUrls.map(url => url.split('.amazonaws.com/')[1]).filter(key => key);
		if (keys.length === 0) return;
		try {
			const objects: ObjectIdentifier[] = keys.map(key => ({ Key: key }));
			await this.s3Client.send(
				new DeleteObjectsCommand({
					Bucket: this.bucketName,
					Delete: { Objects: objects }
				})
			);
		} catch (error) {
			console.error('Failed to delete files from S3:', error);
		}
	}
}
