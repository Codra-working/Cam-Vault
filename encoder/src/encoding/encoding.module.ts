import { Module } from '@nestjs/common';
import { EncodingService } from './encoding.service';
import { DBModule } from 'src/DB/DB.module';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EncodingController } from './encoding.controller';
import { FFMPEGBuilderModule } from './ffmpegBuilder/FFMPEGbuilder.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RMQ_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('rabbitmq.url') ??
                'amqp://localhost:5672',
            ],
            queue:
              configService.get<string>('rabbitmq.queue') ?? 'encoding_queue',
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
    DBModule,
    FFMPEGBuilderModule,
  ],
  providers: [EncodingService],
  controllers: [EncodingController],
})
export class EncodingModule {}
