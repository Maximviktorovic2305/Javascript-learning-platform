import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../common/database/prisma.service';
import { publicUserSelect } from '../auth/auth.types';
import { ProfileDto } from './profile.dto';
import { progressSummary } from './progress';
@Injectable()
export class ProfileService {
  constructor(private readonly db: PrismaService) {}
  async progress(userId: string, timezone: string) {
    const [awards, attempts] = await Promise.all([
      this.db.award.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.db.attempt.findMany({
        where: { userId },
        distinct: ['targetId', 'kind'],
        select: { targetId: true, kind: true },
      }),
    ]);
    return {
      ...progressSummary(awards, timezone),
      started: attempts.map((attempt) => `${attempt.kind}:${attempt.targetId}`),
    };
  }
  update(userId: string, dto: ProfileDto) {
    try {
      new Intl.DateTimeFormat('ru', { timeZone: dto.timezone }).format();
    } catch {
      throw new BadRequestException('Неизвестный часовой пояс.');
    }
    if (dto.name.trim().length < 2)
      throw new BadRequestException('Имя должно содержать минимум 2 символа.');
    return this.db.user.update({
      where: { id: userId },
      data: { ...dto, name: dto.name.trim() },
      select: publicUserSelect,
    });
  }
}
