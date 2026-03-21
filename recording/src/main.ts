import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { AppModule } from './app.module';
import { Options } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const microserviceTCP = app.connectMicroservice(

    {
      transport: Transport.TCP,
      options:
      {
        port: 3001
      }
    })

  await app.startAllMicroservices()
  await app.listen(3001)
}
bootstrap();
