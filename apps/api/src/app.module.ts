import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { CommonModule } from './common/common.module';
import { EventsModule } from './events/events.module';
import { InterviewModule } from './interview/interview.module';
import { ProfileModule } from './profile/profile.module';
import { StagesModule } from './stages/stages.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    StagesModule,
    ApplicationsModule,
    ProfileModule,
    EventsModule,
    TemplatesModule,
    InterviewModule,
    AssessmentsModule,
  ],
  controllers: [AppController],
  providers: [
    // Protect every route by default; opt out with @Public().
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
})
export class AppModule {}
