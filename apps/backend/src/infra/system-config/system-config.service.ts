import { getErrorCode } from '@apiplayer/shared'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InputJsonValue } from '@prisma/client/runtime/client'
import { StatusCodes } from 'http-status-codes'
import { HanaException } from '@/common/exceptions/hana.exception'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { UpdateConfigsReqDto } from './dto/update-config.dto'
import {
  SystemConfigKey,
  systemConfigMetadata,
} from './system-config.types'

@Injectable()
export class SystemConfigService implements OnModuleInit {
  private readonly logger = new Logger(SystemConfigService.name)
  private cache = new Map<string, unknown>()
  private readonly defaults = new Map<string, unknown>()

  constructor(private readonly prisma: PrismaService) {
    for (const config of systemConfigMetadata) {
      this.defaults.set(config.key, config.defaultValue)
    }
  }

  // 初始化加载配置
  async onModuleInit() {
    await this.loadAllConfigs()
    this.logger.log('系统配置已加载到内存缓存')
  }

  /** 加载配置 */
  async loadAllConfigs() {
    try {
      const dbConfigs = await this.prisma.systemConfig.findMany()

      // 先用默认值填充缓存
      for (const config of systemConfigMetadata) {
        this.cache.set(config.key, config.defaultValue)
      }

      // 用数据库中的值覆盖
      for (const config of dbConfigs) {
        this.cache.set(config.key, config.value)
      }
    }
    catch (error) {
      this.logger.error('加载系统配置失败，使用默认值', error)
      for (const config of systemConfigMetadata) {
        this.cache.set(config.key, config.defaultValue)
      }
    }
  }

  /** 获取配置值 */
  get<T>(key: SystemConfigKey): T {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T
    }

    const defaultValue = this.defaults.get(key)
    if (defaultValue !== undefined) {
      return defaultValue as T
    }

    throw new HanaException(`未知的配置键: ${key}`, getErrorCode('CONFIG_NOT_FOUND'), StatusCodes.NOT_FOUND)
  }

  /** 更新配置值 */
  async set(key: SystemConfigKey, value: unknown) {
    // 验证 key 是否合法
    const metadata = systemConfigMetadata.find(c => c.key === key)
    if (!metadata) {
      throw new HanaException(`未知的配置键: ${key}`, getErrorCode('CONFIG_NOT_FOUND'), StatusCodes.NOT_FOUND)
    }

    // 验证枚举类型的值
    if (metadata.type === 'enum' && metadata.options) {
      if (!metadata.options.includes(value as never)) {
        throw new HanaException(
          `配置 ${key} 的值必须是 ${metadata.options.join(', ')}`,
          getErrorCode('CONFIG_INVALID'),
          StatusCodes.BAD_REQUEST,
        )
      }
    }

    // 更新数据库
    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value: value as InputJsonValue },
      create: {
        key,
        value: value as InputJsonValue,
        description: metadata.description,
      },
    })

    // 更新缓存
    this.cache.set(key, value)

    this.logger.log(`配置已更新: ${key} = ${JSON.stringify(value)}`)
  }

  /** 批量更新配置 */
  async setMany(configs: UpdateConfigsReqDto) {
    for (const [key, value] of Object.entries(configs)) {
      await this.set(key as SystemConfigKey, value)
    }
  }

  /** 获取所有配置 */
  getAllWithMetadata() {
    return systemConfigMetadata.map((metadata) => {
      return {
        key: metadata.key,
        value: (this.cache.get(metadata.key) ?? metadata.defaultValue) as InputJsonValue,
        defaultValue: metadata.defaultValue,
        type: metadata.type,
        description: metadata.description,
        options: 'options' in metadata ? metadata.options : undefined,
      }
    })
  }

  /** 刷新缓存 */
  async refresh() {
    await this.loadAllConfigs()
    this.logger.log('系统配置缓存已刷新')
  }

  /** 初始化默认配置 */
  async initializeDefaults() {
    for (const metadata of systemConfigMetadata) {
      const existing = await this.prisma.systemConfig.findUnique({
        where: { key: metadata.key },
      })

      if (!existing) {
        await this.prisma.systemConfig.create({
          data: {
            key: metadata.key,
            value: metadata.defaultValue as InputJsonValue,
            description: metadata.description,
          },
        })
        this.logger.log(`已初始化配置: ${metadata.key}`)
      }
    }
  }
}
