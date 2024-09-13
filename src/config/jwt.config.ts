import { ConfigModule, ConfigService } from '@nestjs/config';

export const jwtConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: async (configService: ConfigService) => ({
		secret: configService.get('JWT_SECRET'),
		signOptions: {
			expiresIn: `${configService.get('JWT_EXPIRE')}s`
		}
	})
};
