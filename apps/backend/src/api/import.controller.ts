import type { FastifyRequest } from 'fastify'
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { ProjectPermissions, RequireProjectMember } from '@/common/decorators/permissions.decorator'
import { ReqUser } from '@/common/decorators/req-user.decorator'
import { ResMsg } from '@/common/decorators/res-msg.decorator'
import { AuthGuard } from '@/common/guards/auth.guard'
import { PermissionsGuard } from '@/common/guards/permissions.guard'
import { ExecuteImportReqDto, ParseOpenapiReqDto } from './dto'
import { ImportService } from './import.service'

@ApiTags('OpenAPI 导入')
@Controller('api/:projectId/import')
@UseGuards(AuthGuard, PermissionsGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('openapi/parse')
  @RequireProjectMember()
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('OpenAPI 文档解析成功')
  @ApiOperation({ summary: '解析 OpenAPI 文档' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: '上传 OpenAPI 文件或提供内容/URL',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'OpenAPI 文件 (JSON/YAML)' },
        content: { type: 'string', description: 'OpenAPI 文档内容' },
        url: { type: 'string', description: 'OpenAPI 文档 URL' },
      },
    },
  })
  async parseOpenapi(
    @Param('projectId') projectId: string,
    @Req() request: FastifyRequest,
    @Body() dto: ParseOpenapiReqDto,
  ) {
    let fileContent: string | undefined

    // 如果是上传文件，直接读取内容
    if (request.isMultipart()) {
      const file = await request.file()
      if (file) {
        const buffer = await file.toBuffer()
        fileContent = buffer.toString('utf-8')
      }
    }

    return this.importService.parseOpenapi(dto, projectId, fileContent)
  }

  @Post('openapi/execute')
  @RequireProjectMember()
  @ProjectPermissions(['api:create'], 'projectId')
  @ResMsg('OpenAPI 文档导入成功')
  @ApiOperation({ summary: '执行 OpenAPI 导入' })
  @ApiParam({ name: 'projectId', description: '项目ID' })
  async executeImport(
    @Param('projectId') projectId: string,
    @Body() dto: ExecuteImportReqDto,
    @ReqUser('id') userId: string,
  ) {
    return this.importService.executeImport(dto, projectId, userId)
  }
}
