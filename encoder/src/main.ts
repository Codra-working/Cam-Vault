import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    AppModule,
    {
      transport:Transport.RMQ,
      options:{
        urls:['amqp://localhost:5672'],
        queue:'encoding_queue',
        noAck:false,
        queueOptions:{
          durable:true
        }
      }
    }
  );
  await app.listen();
}
bootstrap();
