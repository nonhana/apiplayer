import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import * as Joi from 'joi'

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

        // 上传相关配置
        R2_ACCESS_KEY_ID: Joi.string().optional(),
        R2_SECRET_ACCESS_KEY: Joi.string().optional(),
        R2_BUCKET: Joi.string().optional(),
        R2_DOMAIN: Joi.string().optional(),
        R2_ACCOUNT_ID: Joi.string().optional(),

        // 邮件相关配置
        RESEND_API_KEY: Joi.string().optional(),
        RESEND_FROM_EMAIL: Joi.string().email().optional(),
      }),
    }),
  ],
})
export class EnvConfigModule {}
