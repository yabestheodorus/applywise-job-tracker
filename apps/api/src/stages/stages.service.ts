import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';
import { DEFAULT_STAGES } from './default-stages';
import type { CreateStageDto, UpdateStageDto } from './dto';

@Injectable()
export class StagesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Seeds the default stage set the first time a user has none. Idempotent. */
  async ensureSeeded(userId: string): Promise<void> {
    const count = await this.prisma.statusStage.count({ where: { userId } });
    if (count > 0) return;
    await this.prisma.statusStage.createMany({
      data: DEFAULT_STAGES.map((stage) => ({ ...stage, userId })),
    });
  }

  async findAllForUser(userId: string) {
    await this.ensureSeeded(userId);
    return this.prisma.statusStage.findMany({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  /** Returns the user's first (lowest-order) stage, e.g. "Applied". */
  async firstStage(userId: string) {
    await this.ensureSeeded(userId);
    return this.prisma.statusStage.findFirst({
      where: { userId },
      orderBy: { order: 'asc' },
    });
  }

  async assertOwned(userId: string, id: string) {
    const stage = await this.prisma.statusStage.findFirst({ where: { id, userId } });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
  }

  async create(userId: string, dto: CreateStageDto) {
    const order =
      dto.order ??
      ((
        await this.prisma.statusStage.aggregate({
          where: { userId },
          _max: { order: true },
        })
      )._max.order ?? -1) + 1;

    return this.prisma.statusStage.create({
      data: {
        userId,
        label: dto.label,
        color: dto.color ?? '#94a3b8',
        order,
        isTerminal: dto.isTerminal ?? false,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateStageDto) {
    await this.assertOwned(userId, id);
    return this.prisma.statusStage.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    const inUse = await this.prisma.application.count({ where: { userId, statusId: id } });
    if (inUse > 0) {
      throw new ConflictException(
        'This stage still has applications. Move them to another stage first.',
      );
    }
    await this.prisma.statusStage.delete({ where: { id } });
    return { id };
  }
}
