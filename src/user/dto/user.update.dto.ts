import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserUpdateDto {
	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'name',
		example: 'ethank',
		required: false
	})
	name?: string;

	@IsBoolean()
	@IsOptional()
	@ApiProperty({
		description: 'inApp alarm',
		example: true,
		default: true,
		required: false
	})
	alarm?: boolean;

	@IsString()
	@IsOptional()
	@ApiProperty({
		description: 'profile image',
		example: 'https://example.com/profile.jpg',
		required: false
	})
	imgUrl?: string;

	@IsString()
	@IsOptional()
	@MaxLength(60)
	@ApiProperty({
		description: 'User status',
		example: 'Working on a new project',
		required: false,
		maxLength: 60
	})
	status?: string;
}
