import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ConfigModule as MyConfigModule } from 'src/config/config.module';
import { RecordingModule } from './recording/recording.module';
import { DBModule } from './DB/DB.module';
import configuration from './config/configuration';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { VideoCatalogModule } from './video-catalog/video-catalog.module';
import { HealthzController } from './healthz/healthz.controller';
import { HealthzModule } from './healthz/healthz.module';

@Module({
  imports: [
    MyConfigModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    RecordingModule,
    ScheduleModule.forRoot(),
    DBModule,
    EventEmitterModule.forRoot(),
    ConfigModule,
    VideoCatalogModule,
    HealthzModule,
  ],
  controllers: [HealthzController],
})
export class AppModule {}
