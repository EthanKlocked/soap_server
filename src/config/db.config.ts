import { ConfigModule, ConfigService } from '@nestjs/config';

export const dbConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (configService: ConfigService) => {
		const db_path = configService.get<string>('DB_PATH_CUSTOM');
		const db_name = configService.get<string>('DB_NAME_CUSTOM');
		const db_user = configService.get<string>('DB_USER_CUSTOM');
		const db_password = configService.get<string>('DB_PASSWORD_CUSTOM');
		return {
			uri: `mongodb://${db_user}:${encodeURIComponent(db_password)}@${db_path}?authSource=admin`,
			dbName: db_name
		};
	}
};
