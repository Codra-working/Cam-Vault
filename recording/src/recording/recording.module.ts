import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DBModule } from 'src/DB/DB.module';
import { DBService } from 'src/DB/DB.service';
import { ClientsModule, Transport } from '@nestjs/microservices';


@Module({
    imports: [
        ClientsModule.registerAsync(
            [{
                name: 'RMQ_SERVICE',
                imports: [ConfigModule],
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
            }]), ConfigModule, DBModule],
    controllers: [RecordingController],
    providers: [RecordingService, DBService],
    exports: [RecordingService,ClientsModule]
})
export class RecordingModule { }
