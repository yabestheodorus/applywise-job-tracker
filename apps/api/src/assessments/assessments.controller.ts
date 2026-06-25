import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AssessmentsService } from './assessments.service';
import {
  createAssessmentSchema,
  submitAssessmentSchema,
  type CreateAssessmentDto,
  type SubmitAssessmentDto,
} from './dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessments: AssessmentsService) {}

  /** Start a scenario-MCQ test for one of the user's profile skills. */
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createAssessmentSchema)) dto: CreateAssessmentDto,
  ) {
    return this.assessments.create(userId, dto.skill);
  }

  /** History of the user's assessments (newest first). */
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.assessments.listForUser(userId);
  }

  /** One assessment — answers hidden until it's been submitted. */
  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.assessments.findOne(userId, id);
  }

  /** Submit all answers → graded results + AI debrief. */
  @Post(':id/submit')
  submit(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(submitAssessmentSchema)) dto: SubmitAssessmentDto,
  ) {
    return this.assessments.submit(userId, id, dto);
  }
}
