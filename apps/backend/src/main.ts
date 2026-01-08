import { existsSync, mkdirSync } from 'node:fs'
import process from 'node:process'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { UPLOADS_DIR, UPLOADS_URL_PREFIX } from '@/constants/file-upload'
import { AppModule } from './app.module'
import { WinstonLogger } from './common/logger/winston-logger.service'

const STATIC_UPLOAD_ROOT = UPLOADS_DIR

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      trustProxy: '127.0.0.1',
    }),
  )

  const configService = app.get(ConfigService)

  const nodeEnv = configService.get<string>('NODE_ENV')
  const cookieSecret = configService.get<string>('COOKIE_SECRET')
  const port = configService.get<number>('PORT')
  const host = configService.get<string>('HOST')

  if (!existsSync(STATIC_UPLOAD_ROOT)) {
    mkdirSync(STATIC_UPLOAD_ROOT, { recursive: true })
  }

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

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 单文件最大 10MB，可按需调整
      files: 1,
    },
  })

  // 注册静态资源服务
  await app.register(fastifyStatic, {
    root: STATIC_UPLOAD_ROOT,
    prefix: `${UPLOADS_URL_PREFIX}/`,
    decorateReply: false,
  })

  if (nodeEnv !== 'production') {
    app.enableCors({
      origin: ['http://localhost:5173', 'https://apiplayer.caelum.moe'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Apiplayer API')
      .setDescription('API documentation for Apiplayer backend.')
      .setVersion('1.0.0')
      .addCookieAuth('sid', {
        type: 'apiKey',
        in: 'cookie',
        name: 'sid',
        description: 'Session ID cookie set after successful login',
      })
      .build()

    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
      jsonDocumentUrl: 'docs-json',
    })
  }

  await app.listen({ port, host })

  const logger = new Logger('Bootstrap')

  logger.log(`🚀 应用程序已启动，访问地址: http://${host}:${port}`)
  if (nodeEnv !== 'production') {
    logger.log(`📚 Swagger 文档地址: http://${host}:${port}/docs`)
  }
  logger.log(`🌍 环境: ${nodeEnv}`)
}

bootstrap().catch((error) => {
  console.error('应用程序启动失败:', error)
  process.exit(1)
})
