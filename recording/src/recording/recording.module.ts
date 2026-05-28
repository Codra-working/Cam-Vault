import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';


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
            }]), ConfigModule],
    controllers: [RecordingController],
    providers: [RecordingService],
    exports: [RecordingService]
})
export class RecordingModule { }
