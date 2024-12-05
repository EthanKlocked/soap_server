import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileManagerDeleteDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'S3 file URL to delete',
		example: 'https://soaf-image.s3.ap-northeast-2.amazonaws.com/diary/123456789-image.jpg'
	})
	fileUrl: string;
}
