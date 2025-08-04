import process from 'node:process'
import cookie from '@fastify/cookie'
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { AppModule } from './app.module'
import { WinstonLogger } from './common/logger/winston-logger.service'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  )

  const configService = app.get(ConfigService)

  const nodeEnv = configService.get<string>('NODE_ENV')
  const cookieSecret = configService.get<string>('COOKIE_SECRET')
  const port = configService.get<number>('PORT')
  const host = configService.get<string>('HOST')

  console.log(nodeEnv, cookieSecret, port, host)

  if (nodeEnv === 'production') {
    app.useLogger(app.get(WinstonLogger))
  }
  else {
    app.useLogger(new Logger())
  }

  await app.register(cookie, {
    secret: cookieSecret,
    parseOptions: {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
    },
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  if (nodeEnv !== 'production') {
    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  }

  await app.listen({ port, host })

  const logger = new Logger('Bootstrap')

  console.log(`🚀 应用程序已启动，访问地址: http://${host}:${port}`)
  logger.log(`🌍 环境: ${nodeEnv}`)
}

bootstrap().catch((error) => {
  console.error('应用程序启动失败:', error)
  process.exit(1)
})
