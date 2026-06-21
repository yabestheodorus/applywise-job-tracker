import { Module } from '@nestjs/common';

import { ProfileModule } from '../profile/profile.module';
import {
  ApplicationInterviewController,
  InterviewController,
} from './interview.controller';
import { InterviewService } from './interview.service';

@Module({
  imports: [ProfileModule],
  controllers: [ApplicationInterviewController, InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}
