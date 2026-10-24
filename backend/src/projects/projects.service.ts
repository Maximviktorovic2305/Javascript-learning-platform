import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { CatalogService } from '../catalog/catalog.service';
const publicSubmission = {
  projectId: true,
  url: true,
  status: true,
  createdAt: true,
} as const;
@Injectable()
export class ProjectsService {
  constructor(
    private readonly db: PrismaService,
    private readonly catalog: CatalogService,
  ) {}
  submissions(userId: string) {
    return this.db.submission.findMany({
      where: { userId },
      select: publicSubmission,
    });
  }
  submit(userId: string, projectId: string, url: string) {
    if (!this.catalog.projects().some((p) => p.id === projectId))
      throw new NotFoundException('Проект не найден.');
    return this.db.submission.upsert({
      where: { userId_projectId: { userId, projectId } },
      create: { userId, projectId, url },
      update: { url, status: 'submitted' },
      select: publicSubmission,
    });
  }
}
