import { IsString, IsNumber, IsUrl, IsOptional } from 'class-validator';

export class ItemDto {
	@IsString()
	name: string;

	@IsNumber()
	x: number;

	@IsNumber()
	y: number;

	@IsNumber()
	@IsOptional()
	zIndex?: number;

	@IsUrl()
	imageUrl: string;
}
