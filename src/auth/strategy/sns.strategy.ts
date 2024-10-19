import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';
import { Strategy } from 'passport-custom';
import { plainToClass } from 'class-transformer';
import { UserSnsLoginDto } from '@src/user/dto/user.snsLogin.dto';
import { validate } from 'class-validator';
import { SnsValidationResultCase } from '@src/auth/auth.interface';

@Injectable()
export class SnsStrategy extends PassportStrategy(Strategy, 'sns') {
	constructor(private authService: AuthService) {
		super();
	}

	async validate(req: any): Promise<any> {
		const dto = plainToClass(UserSnsLoginDto, req.body);
		const errors = await validate(dto);
		if (errors.length > 0) {
			const messages = errors.map(error => Object.values(error.constraints)).flat();
			throw new UnprocessableEntityException(messages);
		}
		const validateResult = await this.authService.validateSns(req.body);
		switch (validateResult.resultCase) {
			case SnsValidationResultCase.LOGIN:
				const authUser = { id: validateResult.auth.id, email: validateResult.auth.email };
				const accessToken = await this.authService.issueAccessToken(authUser);
				const refreshToken = await this.authService.issueRefreshToken(authUser);
				return {
					resultCase: SnsValidationResultCase.LOGIN,
					access: accessToken,
					refresh: refreshToken
				};
			case SnsValidationResultCase.JOIN:
				return {
					resultCase: SnsValidationResultCase.JOIN,
					message: 'Registration required',
					password: validateResult.resultValue
				};
			case SnsValidationResultCase.SNS:
				return {
					resultCase: SnsValidationResultCase.SNS,
					message: 'Different SNS account exists',
					existingSns: validateResult.resultValue
				};
			default:
				throw new UnauthorizedException('Invalid SNS authentication');
		}
	}
}
