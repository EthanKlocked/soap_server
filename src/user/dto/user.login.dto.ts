import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty({ description: 'mail', example: 'test@test.com' })  
    mail: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'password', example: 'test123' })  
    password: string;
}