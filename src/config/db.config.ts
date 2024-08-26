import { ConfigModule, ConfigService } from '@nestjs/config';

export const dbConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	useFactory: (configService: ConfigService) => {
		const db_path = configService.get<string>('DB_PATH');
		const db_name = configService.get<string>('DB_NAME');
		const db_user = configService.get<string>('DB_USER');
		const db_password = configService.get<string>('DB_PASSWORD');
		return ({
			uri: `mongodb://${db_user}:${encodeURIComponent(db_password)}@${db_path}`,
			dbName: db_name
		});
	}
};