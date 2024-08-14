import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

export const cacheConfig = {
	imports: [ConfigModule],
	inject: [ConfigService],
	isGlobal:true,
	useFactory: (configService: ConfigService) => {
		console.log('REDIS_HOST:', configService.get('REDIS_HOST'));
		console.log('REDIS_PORT:', configService.get('REDIS_PORT'));
		console.log('REDIS_TTL:', configService.get('REDIS_TTL'));
		const option: CacheModuleOptions = {
			ttl: configService.get('REDIS_TTL'),
			store: redisStore,
			host: configService.get('REDIS_HOST'),
			port: configService.get('REDIS_PORT')
		};
		return option;
	}
};