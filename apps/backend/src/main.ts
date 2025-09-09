import process from 'node:process'
import cookie from '@fastify/cookie'
import FastifySwagger from '@fastify/swagger'
import FastifySwaggerUI from '@fastify/swagger-ui'
import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
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

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  )

  if (nodeEnv !== 'production') {
    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })

    // 注册 Fastify Swagger 插件
    await app.register(FastifySwagger, {
      swagger: {
        info: {
          title: 'Apiplayer API',
          description: 'API documentation for Apiplayer backend.',
          version: '1.0.0',
        },
        host: `${host}:${port}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'sid',
            description: 'Session ID cookie set after successful login',
          },
        },
      },
    })

    // 注册 Swagger UI 插件
    await app.register(FastifySwaggerUI, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: header => header,
      transformSpecification: swaggerObject => swaggerObject,
      transformSpecificationClone: true,
    })

    // 使用 NestJS Swagger 设置额外的文档
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
    logger.log(`📖 Fastify 文档地址: http://${host}:${port}/documentation`)
  }
  logger.log(`🌍 环境: ${nodeEnv}`)
}

bootstrap().catch((error) => {
  console.error('应用程序启动失败:', error)
  process.exit(1)
})
