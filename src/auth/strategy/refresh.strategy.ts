import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@src/auth/auth.service';
import { Payload } from '@src/auth/auth.interface';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
	constructor(
		private authService: AuthService,
		private readonly configService: ConfigService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: any) => {
					const execution_env = process.env.NODE_ENV;
					let token = null;
					if (execution_env == 'dev') {
						token =
							request && request.cookies ? request.cookies['refresh_token'] : null;
					}
					if (execution_env == 'prod') {
						token = request.headers['x-refresh-token'];
					}
					return token;
				}
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('REFRESH_SECRET')
		});
	}

	async validate(payload: Payload) {
		const accessToken = await this.authService.issueAccessToken(payload);
		const refreshToken = await this.authService.issueRefreshToken(payload);
		return { access: accessToken, refresh: refreshToken };
	}
}
