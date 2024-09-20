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

	async validateUser(body: UserLoginDto) {
		const option: object = { email: body.email };
		const user = await this.userService.findOne(option);
		if (!user) return null;
		if (!(await compare(body.password, user.password))) return null;
		return await this.userService.findById(user.id);
	}

	async issueAccessToken(authUser: Payload): Promise<string> {
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

	async validateSns(body: {
		email: string;
		name: string;
		sns: string;
	}): Promise<{ id: string; email: string }> {
		// token validation
		// 예: await this.validateSnsToken(body.token, body.sns);

		// check email
		const user = await this.userService.findOne({ email: body.email });
		if (!user) {
			console.log('Registering new user');
			// Create new user
			const newUser = await this.userService.createUser(
				body.email,
				body.name,
				Math.random().toString(36).slice(-8),
				body.sns
			);
			return { id: newUser._id.toString(), email: newUser.email };
		} else {
			console.log('User already exists');
			// 기존 사용자의 SNS 정보 업데이트가 필요한 경우 여기에 로직 추가
			// 예: await this.userService.updateSnsInfo(user._id, body.sns);
			return { id: user._id.toString(), email: user.email };
		}
	}
}
