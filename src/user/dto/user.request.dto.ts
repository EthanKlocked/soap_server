import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserRequestDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'email', example: 'test@test.com' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'password', example: 'test123' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'name', example: 'ethank' })
  name: string;
}
