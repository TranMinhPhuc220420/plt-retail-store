import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export const TIMEOUT_CACHE = 1000 * 60 * 60; // 1 hour

export const getCacheConfig = (configService: ConfigService): CacheModuleOptions => ({
  ttl: configService.get<number>('CACHE_TTL', 1000 * 60 * 60), // default 1 hour
  max: configService.get<number>('CACHE_MAX_ITEMS', 100), // max items in cache
  isGlobal: true,
});
