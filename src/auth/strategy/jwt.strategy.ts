import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@src/auth/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly configService: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: any) => {
					const execution_env = process.env.NODE_ENV;
					let token = null;
					if (execution_env == 'dev') {
						token = request && request.cookies ? request.cookies['access_token'] : null;
					}
					if (execution_env == 'prod') {
						token = request.headers['x-access-token'];
					}
					return token;
				}
			]),
			ignoreExpiration: false,
			secretOrKey: configService.get<string>('JWT_SECRET')
		});
	}

	async validate(payload: Payload) {
		return { id: payload.id, email: payload.email };
	}
}
