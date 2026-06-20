import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createStageSchema,
  updateStageSchema,
  type CreateStageDto,
  type UpdateStageDto,
} from './dto';
import { StagesService } from './stages.service';

@Controller('stages')
export class StagesController {
  constructor(private readonly stages: StagesService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.stages.findAllForUser(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createStageSchema)) dto: CreateStageDto,
  ) {
    return this.stages.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStageSchema)) dto: UpdateStageDto,
  ) {
    return this.stages.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.stages.remove(userId, id);
  }
}
