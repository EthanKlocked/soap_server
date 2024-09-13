import { Module } from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConfig } from '@src/config/jwt.config';
import { JwtStrategy } from '@src/auth/strategy/jwt.strategy';
import { LocalStrategy } from '@src/auth/strategy/local.strategy';
import { RefreshStrategy } from './strategy/refresh.strategy';

@Module({
	imports: [UserModule, PassportModule, JwtModule.registerAsync(jwtConfig)],
	providers: [AuthService, LocalStrategy, JwtStrategy, RefreshStrategy]
})
export class AuthModule {}
