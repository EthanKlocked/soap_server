import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterTokenDto {
	@IsNotEmpty()
	@IsString()
	userId: string;

	@IsNotEmpty()
	@IsString()
	deviceToken: string;

	@IsString()
	deviceType?: string;
}
