import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	isGlobal: true,
	useFactory: (configService: ConfigService) => {
		const option: CacheModuleOptions = {
			ttl: configService.get('REDIS_TTL_CUSTOM'),
			store: redisStore,
			host: configService.get('REDIS_HOST_CUSTOM'),
			port: configService.get('REDIS_PORT_CUSTOM'),
			password: configService.get('REDIS_PASSWORD')
		};
		return option;
	}
};
