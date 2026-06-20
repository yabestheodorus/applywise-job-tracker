import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.enableShutdownHooks(); // lets PrismaService.onModuleDestroy disconnect cleanly

  // API runs on 3001 in dev; the Next.js web app owns 3000.
  const config = app.get(ConfigService);
  const port = Number(config.get('PORT')) || 3001;
  await app.listen(port);
}

void bootstrap();
