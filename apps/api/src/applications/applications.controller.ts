import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ApplicationsService } from './applications.service';
import {
  createApplicationSchema,
  extractApplicationSchema,
  extractStatusSchema,
  updateStatusSchema,
  type CreateApplicationDto,
  type ExtractApplicationDto,
  type ExtractStatusDto,
  type UpdateStatusDto,
} from './dto';
import { ProfileService } from 'src/profile/profile.service';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly profiles: ProfileService,
  ) { }

  @Post('extract')
  async extract(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(extractApplicationSchema)) dto: ExtractApplicationDto,
  ) {
    const user = await this.profiles.getOrCreate(userId);
    return this.applications.extractDraft(dto.rawText, user);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createApplicationSchema)) dto: CreateApplicationDto,
  ) {
    return this.applications.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.applications.findAllForUser(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.applications.findOne(userId, id);
  }

  /** Flow B step 1: Groq suggests which stage a status-update message maps to. */
  @Post(':id/status/extract')
  extractStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(extractStatusSchema)) dto: ExtractStatusDto,
  ) {
    return this.applications.extractStatusUpdate(userId, id, dto.message);
  }

  /** Flow B step 3: apply the confirmed stage change + append a timeline event. */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStatusSchema)) dto: UpdateStatusDto,
  ) {
    return this.applications.updateStatus(userId, id, dto);
  }
}
