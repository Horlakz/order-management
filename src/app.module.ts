import { BullModule } from '@nestjs/bullmq';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';

import { redisStore } from 'cache-manager-redis-store';
import env from './lib/constants/env';
import { RequestLoggingMiddleware } from './middleware/logger.middleware';
import { EmailModule } from './modules/email/email.module';
import { OrderModule } from './modules/order/order.module';
import { AuthGuard } from './modules/user/guards/auth.guard';
import { RoleGuard } from './modules/user/guards/role.guard';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot({ verboseMemoryLeak: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 50 }]),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get(env.REDIS_HOST),
          port: configService.get(env.REDIS_PORT),
        },
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get(env.REDIS_HOST),
            port: configService.get(env.REDIS_PORT),
          },
        });
        return { store: () => store as unknown as CacheStore };
      },
    }),
    EmailModule,
    PrismaModule,
    UserModule,
    OrderModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RoleGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
