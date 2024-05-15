import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserVerifyDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'mail', example: 'test@test.com' })  
  mail: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'verificationCode', example: '000000' })  
  verificationCode: string;
}