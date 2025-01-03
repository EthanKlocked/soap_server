import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { FileManagerService } from '@src/file-manager/file-manager.service';
import { FileManagerPresignedUrlDto } from '@src/file-manager/dto/file-manager.presigned-url.dto';
import { FileManagerDeleteDto } from '@src/file-manager/dto/file-manager.delete.dto';
import { PresignedUrlResponse } from '@src/file-manager/file-manager.interface';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@UseGuards(ApiGuard)
@Controller('file-manager')
@ApiSecurity('api-key')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class FileManagerController {
	constructor(private readonly fileManagerService: FileManagerService) {}

	@ApiTags('File-Management')
	@UseGuards(JwtAuthGuard)
	@Post('presigned-url')
	@ApiOperation({
		summary: 'Get presigned URL',
		description: 'Generates a presigned URL for direct S3 file upload'
	})
	@ApiBody({ type: FileManagerPresignedUrlDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async getPresignedUrl(@Body() body: FileManagerPresignedUrlDto): Promise<PresignedUrlResponse> {
		return this.fileManagerService.generatePresignedUrl(body.fileName, body.fileType);
	}

	@ApiTags('File-Management')
	@UseGuards(JwtAuthGuard)
	@Delete('file')
	@ApiOperation({
		summary: 'Delete file',
		description: 'Deletes a file from S3 storage'
	})
	@ApiBody({ type: FileManagerDeleteDto })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	@ApiResponse({ status: 404, description: 'File not found' })
	async deleteFile(@Body() body: FileManagerDeleteDto): Promise<void> {
		await this.fileManagerService.deleteFile(body.fileUrl);
	}
}
