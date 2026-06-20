import { Global, Module } from '@nestjs/common';

import { GroqService } from './groq.service';
import { PrismaService } from './prisma.service';

/**
 * Cross-cutting providers shared by every feature module (DB access, AI
 * extraction, and other shared infrastructure as it's added). `@Global()` so
 * consumers don't re-import.
 */
@Global()
@Module({
  providers: [PrismaService, GroqService],
  exports: [PrismaService, GroqService],
})
export class CommonModule {}
