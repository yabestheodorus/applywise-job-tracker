import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  coachQuestionSchema,
  generateSessionSchema,
  mockTurnSchema,
  saveTemplateSchema,
  updateQuestionSchema,
  type CoachQuestionDto,
  type GenerateSessionDto,
  type MockTurnDto,
  type SaveTemplateDto,
  type UpdateQuestionDto,
} from './dto';
import { InterviewService } from './interview.service';

/** Session generation + listing, nested under an application. */
@Controller('applications/:applicationId/interview/sessions')
export class ApplicationInterviewController {
  constructor(private readonly interview: InterviewService) {}

  @Post()
  generate(
    @CurrentUser('id') userId: string,
    @Param('applicationId') applicationId: string,
    @Body(new ZodValidationPipe(generateSessionSchema)) dto: GenerateSessionDto,
  ) {
    return this.interview.generate(userId, applicationId, dto);
  }

  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.interview.listForApplication(userId, applicationId);
  }
}

/** Working a session: read, coach, edit, drill, save-to-library, live mock. */
@Controller('interview')
export class InterviewController {
  constructor(private readonly interview: InterviewService) {}

  @Get('sessions/:id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.interview.findOne(userId, id);
  }

  @Post('sessions/:id/mock')
  mock(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mockTurnSchema)) dto: MockTurnDto,
  ) {
    return this.interview.mockTurn(userId, id, dto);
  }

  @Post('questions/:id/coach')
  coach(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(coachQuestionSchema)) dto: CoachQuestionDto,
  ) {
    return this.interview.coach(userId, id, dto);
  }

  @Patch('questions/:id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQuestionSchema)) dto: UpdateQuestionDto,
  ) {
    return this.interview.updateQuestion(userId, id, dto);
  }

  @Post('questions/:id/save-template')
  saveTemplate(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(saveTemplateSchema)) dto: SaveTemplateDto,
  ) {
    return this.interview.saveToTemplate(userId, id, dto);
  }
}
