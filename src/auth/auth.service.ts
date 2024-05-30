import { Injectable } from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { compare } from 'bcrypt';
import { UserLoginDto } from '@src/user/dto/user.login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private jwtService: JwtService,
    ) {}

    async validateUser(body : UserLoginDto){
        const option : object = {'email' : body.email}
		const user = await this.userService.findOne(option);        
		if (!user) return null;
        if (!await compare(body.password, user.password)) return null;
		return await this.userService.findById(user.id);
	}
    
    async issueToken(user: any){
		const payload = { userEmail: user.email, sub: user.id };
		return { accessToken: this.jwtService.sign(payload) };
    }
}