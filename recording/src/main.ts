import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices'
import { AppModule } from './app.module';

async function bootstrap() {
  const port = Number.parseInt(process.env.RECORDING_TCP_PORT ?? process.env.PORT ?? '3001', 10)
  const host = process.env.RECORDING_TCP_HOST ?? '0.0.0.0'
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host,
        port,
      }
    }
  )

  await app.listen()
}
bootstrap();
