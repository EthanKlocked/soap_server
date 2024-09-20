import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';
import { Strategy } from 'passport-custom';

@Injectable()
export class SnsStrategy extends PassportStrategy(Strategy, 'sns') {
	constructor(private authService: AuthService) {
		super();
	}

	async validate(req: any): Promise<any> {
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
