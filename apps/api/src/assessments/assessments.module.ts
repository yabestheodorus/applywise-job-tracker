import { Module } from '@nestjs/common';

import { ProfileModule } from '../profile/profile.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  imports: [ProfileModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}
