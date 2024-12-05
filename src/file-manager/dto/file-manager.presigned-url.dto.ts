import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileManagerPresignedUrlDto {
	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'Name of the file to upload',
		example: 'profile-image.jpg'
	})
	fileName: string;

	@IsString()
	@IsNotEmpty()
	@ApiProperty({
		description: 'MIME type of the file',
		example: 'image/jpeg'
	})
	fileType: string;
}
