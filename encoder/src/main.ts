import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const rabbitMqUrl = process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'
  const queue = process.env.ENCODING_QUEUE ?? 'encoding_queue'
  const app = await NestFactory.createMicroservice(
    AppModule,
    {
      transport:Transport.RMQ,
      options:{
        urls:[rabbitMqUrl],
        queue,
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
