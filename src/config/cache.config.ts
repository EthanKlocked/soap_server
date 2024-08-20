import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	isGlobal:true,
	useFactory: (configService: ConfigService) => {
		const option: CacheModuleOptions = {
			ttl: configService.get('REDIS_TTL'),
			store: redisStore,
			host: configService.get('REDIS_HOST'),
			port: configService.get('REDIS_PORT')
		};
		return option;
	}
};