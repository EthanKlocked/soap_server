import { Injectable } from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { compare } from 'bcryptjs';
import { UserLoginDto } from '@src/user/dto/user.login.dto';
import {
	Payload,
	SnsValidationInput,
	SnsValidationResult,
	SnsValidationResultCase
} from '@src/auth/auth.interface';
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
		if (user.sns != 'local') return null;
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

	async validateSns(body: SnsValidationInput): Promise<SnsValidationResult> {
		// TOKEN VALIDATION
		// 예: await this.validateSnsToken(body.token, body.sns);
		// IF FAILED CASE: FAIL
		// throw new UnauthorizedException('invalid token');

		const user = await this.userService.findOne({ email: body.email });
		let result: SnsValidationResult = {
			resultCase: SnsValidationResultCase.READY,
			resultValue: ''
		};

		if (!user) {
			// CASE : JOIN
			result.resultCase = SnsValidationResultCase.JOIN;
			result.resultValue = Math.random().toString(36).slice(-8);
		} else {
			if (body.sns !== user.sns) {
				// CASE : SNS
				result.resultCase = SnsValidationResultCase.SNS;
				result.resultValue = user.sns;
			} else {
				// CASE : LOGIN
				result.resultCase = SnsValidationResultCase.LOGIN;
				result.resultValue = 'success';
				result.auth = { id: user._id.toString(), email: user.email };
			}
		}
		return result;
	}
}
