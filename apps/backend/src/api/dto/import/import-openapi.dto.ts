import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  registerDecorator,
  ValidateIf,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

/** 冲突处理策略 */
export enum ConflictStrategy {
  /** 跳过冲突的 API */
  SKIP = 'skip',
  /** 覆盖现有 API */
  OVERWRITE = 'overwrite',
  /** 重命名新 API */
  RENAME = 'rename',
}

/** 自定义验证器，确保 content 或 url 至少提供一个 */
@ValidatorConstraint({ name: 'atLeastOneField', async: false })
class AtLeastOneFieldConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const object = args.object as Record<string, unknown>
    const fields = args.constraints as string[]
    return fields.some(field => object[field] !== undefined && object[field] !== null && object[field] !== '')
  }

  defaultMessage(args: ValidationArguments) {
    const fields = args.constraints as string[]
    return `至少需要提供以下字段之一: ${fields.join(', ')}`
  }
}

function AtLeastOneOf(fields: string[], validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: fields,
      validator: AtLeastOneFieldConstraint,
    })
  }
}

/** 解析 OpenAPI 文档请求 DTO（URL 或内容方式） */
export class ParseOpenapiReqDto {
  @IsOptional()
  @IsString({ message: 'OpenAPI 文档内容必须是字符串' })
  @AtLeastOneOf(['content', 'url'], { message: '请提供 OpenAPI 文档内容或 URL（也可上传文件）' })
  content?: string

  @IsOptional()
  @IsString({ message: 'OpenAPI 文档 URL 必须是字符串' })
  @ValidateIf(o => o.url !== undefined && o.url !== '')
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] }, { message: 'URL 格式不正确，必须以 http:// 或 https:// 开头' })
  url?: string
}

/** 执行导入请求 DTO */
export class ExecuteImportReqDto {
  @IsString({ message: 'OpenAPI 文档内容必须是字符串' })
  content: string

  @IsEnum(ConflictStrategy, { message: '冲突处理策略必须是有效的枚举值' })
  conflictStrategy: ConflictStrategy

  @IsOptional()
  @IsString({ message: '目标分组ID必须是字符串' })
  targetGroupId?: string

  @IsOptional()
  @IsBoolean({ message: '是否自动创建分组必须是布尔值' })
  createMissingGroups?: boolean
}
