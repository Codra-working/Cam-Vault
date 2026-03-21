import { Module } from '@nestjs/common';
import { RecordingService } from './recording.service';
import { RecordingController } from './recording.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DBModule } from 'src/DB/DB.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DBService } from 'src/DB/DB.service';
import { ClientsModule, Transport } from '@nestjs/microservices';


@Module({
    imports: [
        ClientsModule.register(
            [{
                name: 'RMQ_SERVICE',
                transport: Transport.RMQ,
                options:
                {
                    urls: ['amqp://localhost:5672'],
                    queue: 'encoding_queue',
                    queueOptions: {
                        durable: true
                    },
                }

            }]), ConfigModule, DBModule],
    controllers: [RecordingController],
    providers: [RecordingService, DBService],
    exports: [RecordingService,ClientsModule]
})
export class RecordingModule { }
