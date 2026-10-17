import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { fileURLToPath } from 'node:url';
import AppModule from './app.module.js';
import HttpExceptionFilter from './filter/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useStaticAssets(fileURLToPath(new URL('./docs/', import.meta.url)), { prefix: '/api' });
  app.enableCors({
    origin: ['null', 'https://codra-working.github.io'],
    methods: ['GET', 'POST', 'DELETE'],
  });

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
