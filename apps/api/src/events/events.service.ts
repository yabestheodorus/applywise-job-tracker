import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../common/prisma.service';
import type { CreateEventDto, UpdateEventDto } from './dto';

// Each upcoming-list row carries enough of its application to render + link.
const withApplication = {
  application: {
    select: {
      id: true,
      company: true,
      role: true,
      status: { select: { id: true, label: true, color: true } },
    },
  },
} as const;

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The "Upcoming" agenda — every flagged event for the user, soonest first. */
  listForUser(userId: string, includeCompleted = false) {
    return this.prisma.scheduledEvent.findMany({
      where: { userId, ...(includeCompleted ? {} : { completed: false }) },
      orderBy: { scheduledAt: 'asc' },
      include: withApplication,
    });
  }

  async create(userId: string, dto: CreateEventDto) {
    // The application must belong to this user.
    const application = await this.prisma.application.findFirst({
      where: { id: dto.applicationId, userId },
      select: { id: true },
    });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.scheduledEvent.create({
      data: {
        userId,
        applicationId: dto.applicationId,
        title: dto.title,
        type: dto.type,
        scheduledAt: new Date(dto.scheduledAt),
        note: dto.note ?? null,
      },
      include: withApplication,
    });
  }

  private async assertOwned(userId: string, id: string) {
    const event = await this.prisma.scheduledEvent.findFirst({ where: { id, userId } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(userId: string, id: string, dto: UpdateEventDto) {
    await this.assertOwned(userId, id);
    return this.prisma.scheduledEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.scheduledAt !== undefined
          ? { scheduledAt: new Date(dto.scheduledAt) }
          : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
      },
      include: withApplication,
    });
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.scheduledEvent.delete({ where: { id } });
    return { id };
  }
}
