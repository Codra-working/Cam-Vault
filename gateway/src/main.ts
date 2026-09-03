import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'node:path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'swagger'), { prefix: '/api' });
  app.enableCors({
    origin: ['null'],
    methods: ['GET'],
  });

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
