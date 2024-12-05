import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PresignedUrlResponse } from '@src/file-manager/file-manager.interface';

@Injectable()
export class FileManagerService {
	private readonly s3Client: S3Client;
	private readonly bucketName: string;
	private readonly region: string;

	constructor(private readonly configService: ConfigService) {
		this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
		this.region = this.configService.get<string>('AWS_REGION');
		this.s3Client = new S3Client({ region: this.region });
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
				fileUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`
			};
		} catch (error) {
			console.error('Error generating presigned URL:', error);
			throw new InternalServerErrorException('Failed to generate presigned URL');
		}
	}
}
