import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { GroqService } from '../common/groq.service';
import { PrismaService } from '../common/prisma.service';
import { StagesService } from '../stages/stages.service';
import {
  extractedDraftSchema,
  jobMatchSchema,
  statusSuggestionSchema,
  type CreateApplicationDto,
  type UpdateStatusDto,
} from './dto';
import {
  COVER_LETTER_SYSTEM_PROMPT,
  JOB_MATCH_SYSTEM_PROMPT,
  NEW_APPLICATION_SYSTEM_PROMPT,
  STATUS_UPDATE_SYSTEM_PROMPT,
} from './prompts';
import { ProfileService } from 'src/profile/profile.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly stages: StagesService,
    private readonly profiles: ProfileService,
  ) { }

  /** Flow A step 2: Groq extracts a NEW-application draft from pasted text. */
  extractDraft(rawText: string, profile: Awaited<
    ReturnType<ProfileService['getOrCreate']>
  >) {
    const user = JSON.stringify({
      rawText,
      userSkills: profile.skills,
    });
    return this.groq.extractJson({
      system: NEW_APPLICATION_SYSTEM_PROMPT,
      user,
      schema: extractedDraftSchema,
    });
  }




  /** Flow A step 3: persist the confirmed draft + seed the initial timeline event. */
  async create(userId: string, dto: CreateApplicationDto) {
    let statusId = dto.statusId;
    if (statusId) {
      await this.stages.assertOwned(userId, statusId); // 404 if not the user's stage
    } else {
      const first = await this.stages.firstStage(userId);
      if (!first) throw new NotFoundException('No stages available');
      statusId = first.id;
    }

    const application = await this.prisma.application.create({
      data: {
        userId,
        company: dto.company,
        role: dto.role,
        source: dto.source,
        rawText: dto.rawText,
        statusId,
        location: dto.location ?? null,
        workArrangement: dto.workArrangement ?? null,
        employmentType: dto.employmentType ?? null,
        seniority: dto.seniority ?? null,
        industry: dto.industry ?? null,
        jobUrl: dto.jobUrl ?? null,
        summary: dto.summary ?? null,
        requirements: dto.requirements,
        skills: dto.skills,
        matchedSkills: dto.matchedSkills,
        gapSkills: dto.gapSkills,
        salaryExpected: dto.salaryExpected ?? null,
        deadlineDate: dto.deadlineDate ? new Date(dto.deadlineDate) : null,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        notes: dto.notes ?? null,
        statusHistory: {
          create: { statusId, note: 'Application added' },
        },
      },
    });

    // Best-effort: score the match on creation if the profile has anything to
    // compare against. Never fail the create if Groq is down/unconfigured.
    try {
      const profile = await this.profiles.getOrCreate(userId);
      if (this.profileHasSubstance(profile)) {
        return await this.computeMatch(userId, application.id);
      }
    } catch (e) {
      this.logger.warn(`Match scoring on create failed: ${String(e)}`);
    }
    return application;
  }

  findAllForUser(userId: string) {
    return this.prisma.application.findMany({
      where: { userId },
      orderBy: { appliedDate: 'desc' },
      include: {
        // The most recent timeline entry — its note powers the card's
        // "latest update" line.
        statusHistory: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
          select: { note: true, occurredAt: true },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const application = await this.prisma.application.findFirst({
      where: { id, userId },
      include: {
        status: true,
        statusHistory: {
          orderBy: { occurredAt: 'desc' },
          include: { status: true },
        },
        scheduledEvents: { orderBy: { scheduledAt: 'asc' } },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  /** Delete an application (and its timeline/events/interview sessions via cascade). */
  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // 404 if not the user's application
    await this.prisma.application.delete({ where: { id } });
    return { id };
  }

  /** Flow B step 1: Groq maps a status-update message to one of the user's stages. */
  async extractStatusUpdate(userId: string, id: string, message: string) {
    const application = await this.findOne(userId, id);
    const stages = await this.stages.findAllForUser(userId);
    const user = JSON.stringify({
      message,
      currentStage: application.status.label,
      stages: stages.map((s) => ({ id: s.id, label: s.label })),
      now: new Date().toISOString(),
    });
    return this.groq.extractJson({
      system: STATUS_UPDATE_SYSTEM_PROMPT,
      user,
      schema: statusSuggestionSchema,
    });
  }

  /**
   * Flow B step 3: move the application to a stage (existing or newly created)
   * and append a StatusEvent to the timeline — atomically.
   */
  async updateStatus(userId: string, id: string, dto: UpdateStatusDto) {
    await this.findOne(userId, id); // 404 if not the user's application

    let statusId = dto.statusId;
    if (statusId) {
      await this.stages.assertOwned(userId, statusId);
    } else {
      const created = await this.stages.create(userId, { label: dto.newStageLabel! });
      statusId = created.id;
    }

    return this.prisma.application.update({
      where: { id },
      data: {
        statusId,
        statusHistory: {
          create: { statusId, note: dto.note ?? null, rawText: dto.rawText ?? null },
        },
        ...(dto.event
          ? {
              scheduledEvents: {
                create: {
                  userId,
                  title: dto.event.title,
                  type: dto.event.type,
                  scheduledAt: new Date(dto.event.scheduledAt),
                  note: dto.event.note ?? null,
                },
              },
            }
          : {}),
      },
      include: {
        status: true,
        statusHistory: {
          orderBy: { occurredAt: 'desc' },
          include: { status: true },
        },
        scheduledEvents: { orderBy: { scheduledAt: 'asc' } },
      },
    });
  }

  /**
   * Score how well the user's profile fits this job (Groq), then persist the
   * score + matched/gap skills + rationale. Used on creation (best-effort) and
   * by the "Recalculate" button on the detail page.
   */
  async computeMatch(userId: string, id: string) {
    const application = await this.findOne(userId, id);
    const profile = await this.profiles.getOrCreate(userId);

    const match = await this.groq.extractJson({
      system: JOB_MATCH_SYSTEM_PROMPT,
      user: JSON.stringify({
        job: {
          role: application.role,
          summary: application.summary,
          requirements: application.requirements,
          skills: application.skills,
        },
        candidate: {
          summary: profile.summary,
          skills: profile.skills,
          yearsExperience: profile.yearsExperience,
          experiences: profile.experiences.map((e) => ({
            title: e.title,
            company: e.company,
            description: e.description,
          })),
        },
      }),
      schema: jobMatchSchema,
    });

    return this.prisma.application.update({
      where: { id },
      data: {
        matchScore: Math.round(match.score),
        matchedSkills: match.matchedSkills,
        gapSkills: match.gapSkills,
        matchRationale: match.rationale,
      },
    });
  }

  /**
   * Generate a tailored cover-letter draft (plain text) from the job + the
   * user's profile. Read-only: returned for copy, never persisted.
   */
  async generateCoverLetter(userId: string, id: string): Promise<{ coverLetter: string }> {
    const application = await this.findOne(userId, id);
    const profile = await this.profiles.getOrCreate(userId);

    const coverLetter = await this.groq.chatText({
      temperature: 0.5,
      messages: [
        { role: 'system', content: COVER_LETTER_SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({
            job: {
              company: application.company,
              role: application.role,
              summary: application.summary,
              requirements: application.requirements,
              skills: application.skills,
            },
            candidate: {
              fullName: profile.fullName,
              headline: profile.headline,
              summary: profile.summary,
              skills: profile.skills,
              yearsExperience: profile.yearsExperience,
              experiences: profile.experiences.map((e) => ({
                title: e.title,
                company: e.company,
                description: e.description,
                skillsUsed: e.skillsUsed,
              })),
            },
          }),
        },
      ],
    });

    return { coverLetter: coverLetter.trim() };
  }

  /** True if the profile has enough content to bother scoring a match against. */
  private profileHasSubstance(
    profile: Awaited<ReturnType<ProfileService['getOrCreate']>>,
  ): boolean {
    return (
      profile.skills.length > 0 ||
      profile.experiences.length > 0 ||
      Boolean(profile.summary)
    );
  }
}
