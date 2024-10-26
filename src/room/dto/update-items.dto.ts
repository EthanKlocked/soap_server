import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateItemDto {
	@IsString()
	@IsOptional()
	name?: string;

	@IsNumber()
	@IsOptional()
	x?: number;

	@IsNumber()
	@IsOptional()
	y?: number;

	@IsBoolean()
	@IsOptional()
	visible?: boolean;

	@IsString()
	@IsOptional()
	type?: 'hobby' | 'interior';
}
