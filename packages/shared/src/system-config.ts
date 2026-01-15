/** 配置键名 */
export const SystemConfigKey = {
  /** 是否允许用户注册 */
  REGISTER_ENABLED: 'register.enabled',
  /** 注册时是否需要邮箱验证 */
  REGISTER_EMAIL_VERIFY: 'register.email_verify',
  /** 团队最大成员数量 */
  TEAM_MAX_MEMBERS: 'team.max_members',
  /** 团队邀请模式 */
  INVITE_MODE: 'invite.mode',
  /** 邀请链接过期天数 */
  INVITE_EXPIRES_DAYS: 'invite.expires_days',
  /** 单个项目最大 API 数量 */
  PROJECT_MAX_APIS: 'project.max_apis',
  /** 单个 API 最大版本数量 */
  API_MAX_VERSIONS: 'api.max_versions',
  /** 是否自动递增 API 版本号 */
  API_VERSION_AUTO_INC: 'api.version.auto_inc',
} as const
export type SystemConfigKey = (typeof SystemConfigKey)[keyof typeof SystemConfigKey]

/** 配置值类型 */
export const ConfigValueType = {
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
  ENUM: 'enum',
} as const
export type ConfigValueType = (typeof ConfigValueType)[keyof typeof ConfigValueType]

/** 团队邀请模式 */
export const TeamInviteMode = {
  DIRECT: 'direct',
  EMAIL: 'email',
} as const
export type TeamInviteMode = (typeof TeamInviteMode)[keyof typeof TeamInviteMode]

/** 配置项元数据定义 */
export interface ConfigMetadata<T = unknown> {
  /** 配置键名 */
  key: SystemConfigKey
  /** 默认值 */
  defaultValue: T
  /** 值类型 */
  type: ConfigValueType
  /** 配置描述 */
  description: string
  /** 枚举类型的可选值 */
  options?: readonly T[]
}

/** 系统配置元数据定义 */
export const systemConfigMetadata = [
  {
    key: SystemConfigKey.REGISTER_ENABLED,
    defaultValue: true,
    type: ConfigValueType.BOOLEAN,
    description: '是否允许用户注册',
  },
  {
    key: SystemConfigKey.REGISTER_EMAIL_VERIFY,
    defaultValue: false,
    type: ConfigValueType.BOOLEAN,
    description: '注册时是否需要邮箱验证',
  },
  {
    key: SystemConfigKey.TEAM_MAX_MEMBERS,
    defaultValue: 50,
    type: ConfigValueType.NUMBER,
    description: '团队最大成员数量',
  },
  {
    key: SystemConfigKey.INVITE_MODE,
    defaultValue: TeamInviteMode.DIRECT,
    type: ConfigValueType.ENUM,
    options: [TeamInviteMode.DIRECT, TeamInviteMode.EMAIL],
    description: '团队邀请模式: direct(直接添加) | email(邮箱邀请)',
  },
  {
    key: SystemConfigKey.INVITE_EXPIRES_DAYS,
    defaultValue: 7,
    type: ConfigValueType.NUMBER,
    description: '邀请链接过期天数',
  },
  {
    key: SystemConfigKey.PROJECT_MAX_APIS,
    defaultValue: 1000,
    type: ConfigValueType.NUMBER,
    description: '单个项目最大 API 数量',
  },
  {
    key: SystemConfigKey.API_MAX_VERSIONS,
    defaultValue: 100,
    type: ConfigValueType.NUMBER,
    description: '单个 API 最大版本数量',
  },
  {
    key: SystemConfigKey.API_VERSION_AUTO_INC,
    defaultValue: true,
    type: ConfigValueType.BOOLEAN,
    description: '是否自动递增 API 版本号',
  },
] as const satisfies readonly ConfigMetadata[]

/** 根据配置键获取对应的值类型 */
type ExtractConfigValue<K extends SystemConfigKey> = Extract<
  (typeof systemConfigMetadata)[number],
  { key: K }
>['defaultValue']

/** 配置值类型映射 */
export type SystemConfigValues = {
  [K in SystemConfigKey]: ExtractConfigValue<K>
}
