import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './common/database/prisma.service';
@Controller('health')
export class HealthController {
  constructor(
    private readonly db: PrismaService,
    private readonly config: ConfigService,
  ) {}
  @Get()
  async health() {
    try {
      await this.db.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('База данных недоступна.');
    }
    return {
      status: 'ok',
      runner: this.config.get<string>('EXECUTION_RUNNER'),
    };
  }
}
