import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';
import { Strategy } from 'passport-custom';
import { plainToClass } from 'class-transformer';
import { UserSnsDto } from '@src/user/dto/user.sns.dto';
import { validate } from 'class-validator';

@Injectable()
export class SnsStrategy extends PassportStrategy(Strategy, 'sns') {
	constructor(private authService: AuthService) {
		super();
	}

	async validate(req: any): Promise<any> {
		const dto = plainToClass(UserSnsDto, req.body);
		const errors = await validate(dto);
		if (errors.length > 0) {
			const messages = errors.map(error => Object.values(error.constraints)).flat();
			throw new UnprocessableEntityException(messages);
		}
		const user = await this.authService.validateSns(req.body);
		if (!user) {
			throw new UnauthorizedException('invalid token');
		}
		const authUser = { id: user.id, email: user.email };
		const accessToken = await this.authService.issueAccessToken(authUser);
		const refreshToken = await this.authService.issueRefreshToken(authUser);
		return { access: accessToken, refresh: refreshToken };
	}
}
