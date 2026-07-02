import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FFMPEGBuilderModule } from './ffmpegBuilder/FFMPEGbuilder.module';
import { DBModule } from 'src/DB/DB.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RMQ_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: configService.get<string[]>('rabbitmq.url'),
            queues: configService.get<string[]>('rabbitmq.queue'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
    StorageModule,
    ConfigModule,
    FFMPEGBuilderModule,
    DBModule,
  ],
  controllers: [RecordingController],
  providers: [RecordingService],
  exports: [RecordingService],
})
export class RecordingModule {}
