import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser({
      email: email,
      password: password,
    });
    if (!user) {
      throw new UnauthorizedException('invalid e-mail or password');
    }
    const authUser = { id: user.id, email: user.email };
    const accessToken = await this.authService.issueAccessToken(authUser);
    const refreshToken = await this.authService.issueRefreshToken(authUser);
    return { access: accessToken, refresh: refreshToken };
  }
}
