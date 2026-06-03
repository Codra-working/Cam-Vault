import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ProcessBuilderModule } from './process-builder/process-builder.module';


@Module({
    imports: [
        ClientsModule.registerAsync([{
            name: 'RMQ_SERVICE',
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                transport: Transport.RMQ,
                options:
                {
                    urls: [configService.get<string>('rabbitmq.url') ?? 'amqp://localhost:5672'],
                    queue: configService.get<string>('rabbitmq.queue') ?? 'encoding_queue',
                    queueOptions: {
                        durable: true
                    },
                }
            }),
        }]),
        ProcessBuilderModule,
    ],
    controllers: [RecordingController],
    exports: [RecordingService]
})
export class RecordingModule { }
