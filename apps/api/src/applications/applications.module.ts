import { Module } from '@nestjs/common';

import { StagesModule } from '../stages/stages.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [StagesModule, ProfileModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule { }
