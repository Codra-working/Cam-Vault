import { Module } from '@nestjs/common';
import { RecordingModule } from 'src/recording/recording.module';
import { CronService } from './cron.service';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports:[RecordingModule,ConfigModule],
    providers:[CronService]
})
export class CronModule {}
