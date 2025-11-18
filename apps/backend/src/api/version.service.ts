import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/infra/prisma/prisma.service'
import { ProjectUtilsService } from '@/project/utils.service'

@Injectable()
export class VersionService {
  private readonly logger = new Logger(VersionService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly projectUtilsService: ProjectUtilsService,
  ) {}
}
