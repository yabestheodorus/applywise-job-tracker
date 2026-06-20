import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  applyTemplatesSchema,
  createTemplateSchema,
  extractTemplatesSchema,
  updateTemplateSchema,
  type ApplyTemplatesDto,
  type CreateTemplateDto,
  type ExtractTemplatesDto,
  type UpdateTemplateDto,
} from './dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.templates.findAllForUser(userId);
  }

  /** Mine a pasted application form for Q&A drafts (no DB write). */
  @Post('extract')
  extract(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(extractTemplatesSchema)) dto: ExtractTemplatesDto,
  ) {
    return this.templates.extract(userId, dto.rawText);
  }

  /** Persist the reviewed drafts (create new + update matched). */
  @Post('apply')
  apply(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(applyTemplatesSchema)) dto: ApplyTemplatesDto,
  ) {
    return this.templates.apply(userId, dto);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createTemplateSchema)) dto: CreateTemplateDto,
  ) {
    return this.templates.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTemplateSchema)) dto: UpdateTemplateDto,
  ) {
    return this.templates.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.templates.remove(userId, id);
  }
}
