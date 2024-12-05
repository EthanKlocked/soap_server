import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileManagerService } from '@src/file-manager/file-manager.service';
import { FileManagerController } from '@src/file-manager/file-manager.controller';

@Module({
	imports: [ConfigModule],
	controllers: [FileManagerController],
	providers: [FileManagerService],
	exports: [FileManagerService]
})
export class FileManagerModule {}
