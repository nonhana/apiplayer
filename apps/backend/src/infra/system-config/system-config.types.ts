/** 配置值类型 */
export type ConfigValueType = 'boolean' | 'number' | 'string' | 'enum'

/** 配置项元数据定义 */
export interface ConfigMetadata<T = unknown> {
  /** 配置键名 */
  key: string
  /** 默认值 */
  defaultValue: T
  /** 值类型 */
  type: ConfigValueType
  /** 配置描述 */
  description: string
  /** 枚举类型的可选值 */
  options?: readonly T[]
}

/** 团队邀请模式 */
export type TeamInviteMode = 'direct' | 'email'

/** 系统配置元数据定义 */
export const systemConfigMetadata = [
  {
    key: 'registration.enabled',
    defaultValue: true,
    type: 'boolean',
    description: '是否允许用户注册',
  },
  {
    key: 'registration.email_verification',
    defaultValue: false,
    type: 'boolean',
    description: '注册时是否需要邮箱验证',
  },
  {
    key: 'team.max_members',
    defaultValue: 50,
    type: 'number',
    description: '团队最大成员数量',
  },
  {
    key: 'team.invite_mode',
    defaultValue: 'direct',
    type: 'enum',
    options: ['direct', 'email'],
    description: '团队邀请模式: direct(直接添加) | email(邮箱邀请)',
  },
  {
    key: 'invitation.expires_days',
    defaultValue: 7,
    type: 'number',
    description: '邀请链接过期天数',
  },
  {
    key: 'project.max_apis',
    defaultValue: 1000,
    type: 'number',
    description: '单个项目最大 API 数量',
  },
  {
    key: 'api.max_versions',
    defaultValue: 100,
    type: 'number',
    description: '单个 API 最大版本数量',
  },
  {
    key: 'version.auto_increment',
    defaultValue: true,
    type: 'boolean',
    description: '是否自动递增版本号',
  },
] as const satisfies readonly ConfigMetadata[]

/** 所有配置键的联合类型 */
export type SystemConfigKey = (typeof systemConfigMetadata)[number]['key']

/** 根据配置键获取对应的值类型 */
type ExtractConfigValue<K extends SystemConfigKey> = Extract<
  (typeof systemConfigMetadata)[number],
  { key: K }
>['defaultValue']

/** 配置值类型映射 */
export type SystemConfigValues = {
  [K in SystemConfigKey]: ExtractConfigValue<K>
}
