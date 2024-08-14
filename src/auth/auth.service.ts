import { Injectable } from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { compare } from 'bcryptjs';
import { UserLoginDto } from '@src/user/dto/user.login.dto';
import { Payload } from '@src/auth/auth.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async validateUser(body : UserLoginDto){
        const option : object = {'email' : body.email}
		const user = await this.userService.findOne(option);        
		if (!user) return null;
        if (!await compare(body.password, user.password)) return null;
		return await this.userService.findById(user.id);
	}
    
    async issueAccessToken(authUser: Payload) : Promise<string>{
		const payload = { email: authUser.email, id: authUser.id };
		return this.jwtService.signAsync(payload);
    }

    async issueRefreshToken(authUser: Payload): Promise<string> {
        const payload = { email: authUser.email, id: authUser.id };
        return this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('REFRESH_SECRET'),
            expiresIn: `${this.configService.get<number>('REFRESH_EXPIRE')}s`
        });
    }
}