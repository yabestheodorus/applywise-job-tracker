import { Injectable, NotFoundException } from '@nestjs/common';

import { GroqService } from '../common/groq.service';
import { PrismaService } from '../common/prisma.service';
import { ProfileService } from '../profile/profile.service';
import {
  coachSchema,
  mockReviewSchema,
  questionGenerationSchema,
  type CoachQuestionDto,
  type GenerateSessionDto,
  type MockTurnDto,
  type SaveTemplateDto,
  type UpdateQuestionDto,
} from './dto';
import {
  INTERVIEW_COACH_SYSTEM_PROMPT,
  INTERVIEW_MOCK_REVIEW_SYSTEM_PROMPT,
  INTERVIEW_MOCK_SYSTEM_PROMPT,
  INTERVIEW_QUESTION_GENERATION_SYSTEM_PROMPT,
} from './prompts';

const DEFAULT_QUESTION_COUNT = 8;

// Human-readable topic for each category when saving an answer to the library.
const CATEGORY_TOPIC: Record<string, string> = {
  BEHAVIORAL: 'Behavioral',
  TECHNICAL: 'Technical',
  ROLE_FIT: 'Role Fit',
  COMPANY: 'Company',
  GAP: 'Skills',
  LOGISTICS: 'Logistics',
};

const sessionInclude = {
  questions: { orderBy: { order: 'asc' } },
  application: {
    select: { id: true, company: true, role: true },
  },
} as const;

@Injectable()
export class InterviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly profiles: ProfileService,
  ) {}

  /** Generate a tailored question set for one application and persist a session. */
  async generate(userId: string, applicationId: string, dto: GenerateSessionDto) {
    const application = await this.prisma.application.findFirst({
      where: { id: applicationId, userId },
    });
    if (!application) throw new NotFoundException('Application not found');

    const profile = await this.profiles.getOrCreate(userId);
    const topics = await this.prisma.template.findMany({
      where: { userId },
      select: { topic: true },
    });
    const count = dto.count ?? DEFAULT_QUESTION_COUNT;

    const user = JSON.stringify({
      job: {
        company: application.company,
        role: application.role,
        seniority: application.seniority,
        summary: application.summary,
        requirements: application.requirements,
        skills: application.skills,
      },
      candidate: {
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
      gapSkills: application.gapSkills,
      existingTopics: [...new Set(topics.map((t) => t.topic))],
      count,
    });

    const draft = await this.groq.extractJson({
      system: INTERVIEW_QUESTION_GENERATION_SYSTEM_PROMPT,
      user,
      schema: questionGenerationSchema,
    });

    return this.prisma.interviewSession.create({
      data: {
        userId,
        applicationId,
        status: 'IN_PROGRESS',
        questions: {
          create: draft.questions.map((q, i) => ({
            userId,
            order: i,
            category: q.category,
            question: q.question,
            rationale: q.rationale ?? null,
            talkingPoints: q.talkingPoints,
          })),
        },
      },
      include: sessionInclude,
    });
  }

  listForApplication(userId: string, applicationId: string) {
    return this.prisma.interviewSession.findMany({
      where: { userId, applicationId },
      orderBy: { createdAt: 'desc' },
      include: sessionInclude,
    });
  }

  async findOne(userId: string, sessionId: string) {
    const session = await this.prisma.interviewSession.findFirst({
      where: { id: sessionId, userId },
      include: sessionInclude,
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  private async getOwnedQuestion(userId: string, questionId: string) {
    const question = await this.prisma.interviewQuestion.findFirst({
      where: { id: questionId, userId },
    });
    if (!question) throw new NotFoundException('Question not found');
    return question;
  }

  /** Grade the user's attempt, store coaching, and refresh session readiness. */
  async coach(userId: string, questionId: string, dto: CoachQuestionDto) {
    const question = await this.getOwnedQuestion(userId, questionId);
    const profile = await this.profiles.getOrCreate(userId);

    const user = JSON.stringify({
      category: question.category,
      question: question.question,
      userAnswer: dto.userAnswer,
      candidate: {
        headline: profile.headline,
        skills: profile.skills,
        experiences: profile.experiences.map((e) => ({
          title: e.title,
          company: e.company,
        })),
      },
    });

    const result = await this.groq.extractJson({
      system: INTERVIEW_COACH_SYSTEM_PROMPT,
      user,
      schema: coachSchema,
    });

    const updated = await this.prisma.interviewQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: dto.userAnswer,
        feedback: result.feedback,
        improvedAnswer: result.improvedAnswer,
        keyPoints: result.keyPoints,
        score: result.score,
        practiceStatus: 'REVIEWED',
      },
    });
    await this.recomputeReadiness(question.sessionId);
    return updated;
  }

  async updateQuestion(userId: string, questionId: string, dto: UpdateQuestionDto) {
    const question = await this.getOwnedQuestion(userId, questionId);
    const updated = await this.prisma.interviewQuestion.update({
      where: { id: questionId },
      data: {
        ...(dto.userAnswer !== undefined ? { userAnswer: dto.userAnswer } : {}),
        ...(dto.improvedAnswer !== undefined
          ? { improvedAnswer: dto.improvedAnswer }
          : {}),
        ...(dto.selfRating !== undefined ? { selfRating: dto.selfRating } : {}),
        ...(dto.practiceStatus !== undefined
          ? { practiceStatus: dto.practiceStatus }
          : {}),
      },
    });
    await this.recomputeReadiness(question.sessionId);
    return updated;
  }

  /** Save the polished answer into the existing Template library. */
  async saveToTemplate(userId: string, questionId: string, dto: SaveTemplateDto) {
    const question = await this.getOwnedQuestion(userId, questionId);
    const answer = dto.answer ?? question.improvedAnswer ?? question.userAnswer;
    if (!answer) {
      throw new NotFoundException('No answer to save yet — coach it first');
    }
    const template = await this.prisma.template.create({
      data: {
        userId,
        topic: dto.topic ?? CATEGORY_TOPIC[question.category] ?? 'Others',
        question: question.question,
        answer,
      },
    });
    await this.prisma.interviewQuestion.update({
      where: { id: questionId },
      data: { savedTemplateId: template.id },
    });
    return template;
  }

  /** One turn of the live mock interview (stateless: the client sends the transcript). */
  async mockTurn(userId: string, sessionId: string, dto: MockTurnDto) {
    const session = await this.findOne(userId, sessionId);
    const application = await this.prisma.application.findFirst({
      where: { id: session.applicationId, userId },
    });
    if (!application) throw new NotFoundException('Application not found');
    const profile = await this.profiles.getOrCreate(userId);

    const ctx = JSON.stringify({
      job: {
        company: application.company,
        role: application.role,
        seniority: application.seniority,
        requirements: application.requirements,
        skills: application.skills,
      },
      candidate: {
        headline: profile.headline,
        skills: profile.skills,
        yearsExperience: profile.yearsExperience,
      },
      gapSkills: application.gapSkills,
    });

    const reply = await this.groq.chatText({
      temperature: 0.6,
      messages: [
        { role: 'system', content: INTERVIEW_MOCK_SYSTEM_PROMPT(ctx) },
        ...dto.messages,
      ],
    });
    return { reply };
  }

  /** End-of-mock debrief: review the transcript and return structured feedback. */
  async reviewMock(userId: string, sessionId: string, dto: MockTurnDto) {
    const session = await this.findOne(userId, sessionId);
    if (!dto.messages.some((m) => m.role === 'user')) {
      throw new NotFoundException('Answer at least one question before reviewing');
    }
    const application = await this.prisma.application.findFirst({
      where: { id: session.applicationId, userId },
    });
    if (!application) throw new NotFoundException('Application not found');

    const user = JSON.stringify({
      job: { role: application.role, skills: application.skills },
      transcript: dto.messages,
    });
    return this.groq.extractJson({
      system: INTERVIEW_MOCK_REVIEW_SYSTEM_PROMPT,
      user,
      schema: mockReviewSchema,
    });
  }

  /**
   * Readiness = average per-question progress, 0–100. A reviewed question counts
   * for its self-rating (or 0.7 if not yet drilled); an answered-but-unreviewed
   * one counts 0.3. All reviewed → session COMPLETED.
   */
  private async recomputeReadiness(sessionId: string) {
    const questions = await this.prisma.interviewQuestion.findMany({
      where: { sessionId },
      select: { practiceStatus: true, selfRating: true },
    });
    if (questions.length === 0) return;

    const total = questions.reduce((sum, q) => {
      if (q.practiceStatus === 'REVIEWED') {
        return sum + (q.selfRating ? q.selfRating / 5 : 0.7);
      }
      if (q.practiceStatus === 'ANSWERED') return sum + 0.3;
      return sum;
    }, 0);
    const readinessScore = Math.round((total / questions.length) * 100);
    const allReviewed = questions.every((q) => q.practiceStatus === 'REVIEWED');

    await this.prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        readinessScore,
        status: allReviewed ? 'COMPLETED' : 'IN_PROGRESS',
      },
    });
  }
}
