import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class SendPushDto {
	@IsNotEmpty()
	@IsString()
	title: string;

	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	@IsObject()
	data?: Record<string, any>;
}
