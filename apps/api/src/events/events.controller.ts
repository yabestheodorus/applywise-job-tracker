import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  createEventSchema,
  updateEventSchema,
  type CreateEventDto,
  type UpdateEventDto,
} from './dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /** The Upcoming agenda. `?completed=true` includes done items. */
  @Get()
  list(
    @CurrentUser('id') userId: string,
    @Query('completed') completed?: string,
  ) {
    return this.events.listForUser(userId, completed === 'true');
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createEventSchema)) dto: CreateEventDto,
  ) {
    return this.events.create(userId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateEventSchema)) dto: UpdateEventDto,
  ) {
    return this.events.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.events.remove(userId, id);
  }
}
