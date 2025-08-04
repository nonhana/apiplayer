import { Inject, Injectable, LoggerService } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createLogger, format, Logger, transports } from 'winston'
import 'winston-daily-rotate-file'

@Injectable()
export class WinstonLogger implements LoggerService {
  @Inject(ConfigService)
  private readonly configService: ConfigService

  private logger: Logger

  constructor() {
    this.logger = createLogger({
      level: this.configService.get<string>('NODE_ENV') === 'production' ? 'info' : 'debug',
      format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}] : ${message}`
        }),
      ),
      transports: [
        new transports.Console({ format: format.combine(format.colorize(), format.simple()) }),
        new transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        new transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          level: 'error',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    })
  }

  log(message: string) {
    this.logger.info(message)
  }

  error(message: string, trace: string) {
    this.logger.error(`${message} - ${trace}`)
  }

  warn(message: string) {
    this.logger.warn(message)
  }

  debug(message: string) {
    this.logger.debug(message)
  }
}
