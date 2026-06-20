import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { cvExtractedDraftSchema, type UpdateProfileInput } from '@repo/api';
import { Prisma } from '@repo/database';

import { GroqService } from '../common/groq.service';
import { PrismaService } from '../common/prisma.service';
import { parseCvToText } from './cv-parser';
import { CV_EXTRACTION_SYSTEM_PROMPT } from './prompts';

/** Long CVs can exceed the model context — cap the text we send to Groq. */
const MAX_CV_CHARS = 16_000;

const withChildren = {
  experiences: { orderBy: { order: 'asc' } },
  education: { orderBy: { order: 'asc' } },
} as const;

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) { }

  /** One profile per user — created lazily so the form always has a row. */
  getOrCreate(userId: string) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: withChildren,
    });
  }

  /** Replace the profile + its experience/education rows in one transaction. */
  async update(userId: string, dto: UpdateProfileInput) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.prisma.$transaction([
      this.prisma.workExperience.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.education.deleteMany({ where: { profileId: profile.id } }),
      this.prisma.userProfile.update({
        where: { id: profile.id },
        data: {
          fullName: dto.fullName ?? null,
          headline: dto.headline ?? null,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          location: dto.location ?? null,
          summary: dto.summary ?? null,
          links: dto.links ? (dto.links as Prisma.InputJsonValue) : Prisma.JsonNull,
          skills: dto.skills,
          yearsExperience: dto.yearsExperience ?? null,
          certifications: dto.certifications,
          languages: dto.languages,
          experiences: {
            create: dto.experiences.map((e, i) => ({
              company: e.company,
              title: e.title,
              location: e.location ?? null,
              startDate: e.startDate ?? null,
              endDate: e.endDate ?? null,
              isCurrent: e.isCurrent,
              description: e.description ?? null,
              skillsUsed: e.skillsUsed,
              order: i,
            })),
          },
          education: {
            create: dto.education.map((e, i) => ({
              institution: e.institution,
              degree: e.degree ?? null,
              fieldOfStudy: e.fieldOfStudy ?? null,
              startDate: e.startDate ?? null,
              endDate: e.endDate ?? null,
              description: e.description ?? null,
              order: i,
            })),
          },
        },
      }),
    ]);

    return this.getOrCreate(userId);
  }

  /**
   * Parse an uploaded CV to text, run Groq extraction, and persist the raw text
   * (the file itself is not stored). Returns a DRAFT for review — the profile's
   * structured fields are only written when the user submits the form.
   */
  async extractFromCv(
    userId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer },
  ): Promise<UpdateProfileInput> {
    const text = await parseCvToText(file);

    if (!text.trim()) {
      await this.prisma.userProfile.upsert({
        where: { userId },
        create: { userId, cvFileName: file.originalname, cvParseStatus: 'FAILED' },
        update: { cvFileName: file.originalname, cvParseStatus: 'FAILED' },
      });
      throw new UnprocessableEntityException(
        "Couldn't read text from this CV — try a text-based PDF or DOCX.",
      );
    }

    const draft = await this.groq.extractJson({
      system: CV_EXTRACTION_SYSTEM_PROMPT,
      user: text.slice(0, MAX_CV_CHARS),
      schema: cvExtractedDraftSchema,
    });

    await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        cvRawText: text,
        cvFileName: file.originalname,
        cvUploadedAt: new Date(),
        cvParseStatus: 'COMPLETED',
      },
      update: {
        cvRawText: text,
        cvFileName: file.originalname,
        cvUploadedAt: new Date(),
        cvParseStatus: 'COMPLETED',
      },
    });

    return draft;
  }
}
