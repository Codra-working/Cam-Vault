import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { RecordingModule } from './recording/recording.module';
import { CronModule } from './cron/cron.module';
import { DBModule } from './DB/DB.module';
import { VideoMetadata } from './DB/videoMetadata.entity';
import configuration from './config/configuration';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [RecordingModule,
    ScheduleModule.forRoot(),
    CronModule,
    ConfigModule.forRoot({
      load:[configuration]
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities:[VideoMetadata],
      synchronize: true,
    }),
    DBModule,
  ],
})
export class AppModule {}
