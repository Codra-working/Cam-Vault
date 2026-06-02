import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecordingModule } from './recording/recording.module';
import { CronModule } from './cron/cron.module';
import { DBModule } from './DB/DB.module';
import { VideoMetadata } from './DB/videoMetadata.entity';
import configuration from './config/configuration';

import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    RecordingModule,
    ScheduleModule.forRoot(),
    CronModule,
    DBModule,
    EventEmitterModule.forRoot()
  ],
})
export class AppModule { }
