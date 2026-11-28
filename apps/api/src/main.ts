import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureHttp } from './common/configure-http';
import { AppModule } from './app.module';
import { loadConfig } from './config';

async function bootstrap() {
  process.env.TZ ??= 'UTC';
  const config = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureHttp(app);
  await app.listen(config.port);
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown startup error.';
  console.error(`CineX API configuration error: ${message}`);
  process.exitCode = 1;
});
