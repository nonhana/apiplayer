import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import Joi from 'joi'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
        PORT: Joi.number().default(1204),
        HOST: Joi.string().default('0.0.0.0'),
        COOKIE_SECRET: Joi.string().optional(),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_DB: Joi.number().default(0),
        REDIS_PASSWORD: Joi.string().optional(),
      }),
    }),
  ],
})
export class EnvConfigModule {}
