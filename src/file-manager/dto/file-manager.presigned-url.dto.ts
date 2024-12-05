import { IsString, IsNotEmpty } from 'class-validator';

export class FileManagerPresignedUrlDto {
	@IsString()
	@IsNotEmpty()
	fileName: string;

	@IsString()
	@IsNotEmpty()
	fileType: string;
}
