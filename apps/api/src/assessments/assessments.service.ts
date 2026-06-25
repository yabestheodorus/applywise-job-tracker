import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { GroqService } from '../common/groq.service';
import { PrismaService } from '../common/prisma.service';
import { ProfileService } from '../profile/profile.service';
import {
  debriefSchema,
  questionGenerationSchema,
  type SubmitAssessmentDto,
} from './dto';
import {
  SKILL_TEST_DEBRIEF_SYSTEM_PROMPT,
  SKILL_TEST_GENERATION_SYSTEM_PROMPT,
} from './prompts';

/** 12 questions per test, weighted toward mid-level real-world judgement. */
const DEFAULT_COUNTS = { junior: 4, mid: 5, senior: 3 };

const DIFFICULTY_WEIGHT: Record<'JUNIOR' | 'MID' | 'SENIOR', number> = {
  JUNIOR: 1,
  MID: 2,
  SENIOR: 3,
};

type AssessmentWithQuestions = NonNullable<
  Awaited<ReturnType<AssessmentsService['findRaw']>>
>;

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
    private readonly profiles: ProfileService,
  ) {}

  /** Generate + persist a new test for one of the user's profile skills. */
  async create(userId: string, skill: string) {
    const profile = await this.profiles.getOrCreate(userId);

    // You can only be tested on a skill that's actually on your profile.
    const canonical = profile.skills.find(
      (s) => s.toLowerCase() === skill.toLowerCase(),
    );
    if (!canonical) {
      throw new BadRequestException(
        'That skill is not on your profile. Add it first, then test it.',
      );
    }

    const relevant = profile.experiences
      .filter((e) =>
        e.skillsUsed.some((s) => s.toLowerCase() === canonical.toLowerCase()),
      )
      .slice(0, 4)
      .map((e) => ({ title: e.title, summary: e.description ?? '' }));

    const generated = await this.groq.extractJson({
      system: SKILL_TEST_GENERATION_SYSTEM_PROMPT,
      user: JSON.stringify({
        skill: canonical,
        candidate: {
          yearsExperience: profile.yearsExperience,
          seniorityHints: profile.headline ?? '',
          relevantExperience: relevant.length
            ? relevant
            : profile.experiences
                .slice(0, 2)
                .map((e) => ({ title: e.title, summary: e.description ?? '' })),
        },
        counts: DEFAULT_COUNTS,
      }),
      schema: questionGenerationSchema,
    });

    const assessment = await this.prisma.skillAssessment.create({
      data: {
        userId,
        skill: canonical,
        status: 'IN_PROGRESS',
        questionCount: generated.questions.length,
        questions: {
          create: generated.questions.map((q, i) => ({
            userId,
            order: i,
            difficulty: q.difficulty,
            subtopic: q.subtopic,
            scenario: q.scenario,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return this.serialize(assessment);
  }

  /** History — one row per past/active assessment, newest first (no questions). */
  listForUser(userId: string) {
    return this.prisma.skillAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        skill: true,
        status: true,
        questionCount: true,
        correctCount: true,
        scorePct: true,
        level: true,
        createdAt: true,
        completedAt: true,
      },
    });
  }

  async findOne(userId: string, id: string) {
    const assessment = await this.findRaw(userId, id);
    if (!assessment) throw new NotFoundException('Assessment not found');
    return this.serialize(assessment);
  }

  /** Grade all answers deterministically, derive a level, and attach an AI debrief. */
  async submit(userId: string, id: string, dto: SubmitAssessmentDto) {
    const assessment = await this.findRaw(userId, id);
    if (!assessment) throw new NotFoundException('Assessment not found');
    if (assessment.status === 'COMPLETED') {
      throw new BadRequestException('This assessment was already submitted.');
    }

    const picks = new Map(dto.answers.map((a) => [a.questionId, a.selectedIndex]));

    let correctCount = 0;
    let earnedWeight = 0;
    let totalWeight = 0;
    const graded = assessment.questions.map((q) => {
      const selectedIndex = picks.get(q.id) ?? null;
      const isCorrect = selectedIndex === q.correctIndex;
      const weight = DIFFICULTY_WEIGHT[q.difficulty];
      totalWeight += weight;
      if (isCorrect) {
        correctCount += 1;
        earnedWeight += weight;
      }
      return { id: q.id, selectedIndex, isCorrect, subtopic: q.subtopic, difficulty: q.difficulty };
    });

    const total = assessment.questions.length;
    const scorePct = total ? Math.round((correctCount / total) * 100) : 0;
    const weightedPct = totalWeight ? (earnedWeight / totalWeight) * 100 : 0;
    const level = this.levelFor(weightedPct);

    // Debrief is best-effort — a Groq hiccup shouldn't lose the user's score.
    let debrief = { summary: null as string | null, strengths: [] as string[], focusAreas: [] as string[] };
    try {
      debrief = await this.groq.extractJson({
        system: SKILL_TEST_DEBRIEF_SYSTEM_PROMPT,
        user: JSON.stringify({
          skill: assessment.skill,
          results: graded.map((g) => ({
            subtopic: g.subtopic,
            difficulty: g.difficulty,
            correct: g.isCorrect,
          })),
        }),
        schema: debriefSchema,
      });
    } catch (e) {
      this.logger.warn(`Debrief generation failed: ${String(e)}`);
    }

    await this.prisma.$transaction([
      ...graded.map((g) =>
        this.prisma.assessmentQuestion.update({
          where: { id: g.id },
          data: { selectedIndex: g.selectedIndex, isCorrect: g.isCorrect },
        }),
      ),
      this.prisma.skillAssessment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          correctCount,
          scorePct,
          level,
          summary: debrief.summary,
          strengths: debrief.strengths,
          focusAreas: debrief.focusAreas,
          completedAt: new Date(),
        },
      }),
    ]);

    return this.findOne(userId, id);
  }

  /** Internal: full row with ordered questions, ownership-scoped. */
  private findRaw(userId: string, id: string) {
    return this.prisma.skillAssessment.findFirst({
      where: { id, userId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  private levelFor(weightedPct: number): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    if (weightedPct >= 85) return 'EXPERT';
    if (weightedPct >= 65) return 'ADVANCED';
    if (weightedPct >= 40) return 'INTERMEDIATE';
    return 'BEGINNER';
  }

  /**
   * Strip correct answers + explanations from questions until the assessment is
   * COMPLETED — the client must not be able to peek before submitting.
   */
  private serialize(assessment: AssessmentWithQuestions) {
    const revealed = assessment.status === 'COMPLETED';
    return {
      id: assessment.id,
      skill: assessment.skill,
      status: assessment.status,
      questionCount: assessment.questionCount,
      correctCount: assessment.correctCount,
      scorePct: assessment.scorePct,
      level: assessment.level,
      summary: assessment.summary,
      strengths: assessment.strengths,
      focusAreas: assessment.focusAreas,
      createdAt: assessment.createdAt,
      completedAt: assessment.completedAt,
      questions: assessment.questions.map((q) => ({
        id: q.id,
        order: q.order,
        difficulty: q.difficulty,
        subtopic: q.subtopic,
        scenario: q.scenario,
        prompt: q.prompt,
        options: q.options,
        selectedIndex: q.selectedIndex,
        // Withheld until graded:
        correctIndex: revealed ? q.correctIndex : null,
        explanation: revealed ? q.explanation : null,
        isCorrect: revealed ? q.isCorrect : null,
      })),
    };
  }
}
