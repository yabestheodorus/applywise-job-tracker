import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { ApplicationsModule } from './applications/applications.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { CommonModule } from './common/common.module';
import { ProfileModule } from './profile/profile.module';
import { StagesModule } from './stages/stages.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    StagesModule,
    ApplicationsModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    // Protect every route by default; opt out with @Public().
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
  ],
})
export class AppModule {}
