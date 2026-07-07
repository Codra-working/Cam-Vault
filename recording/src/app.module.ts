import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecordingModule } from './recording/recording.module';
import { CronModule } from './cron/cron.module';
import { DBModule } from './DB/DB.module';
import { VideoMetadata } from './DB/videoMetadata.entity';
import configuration from './config/configuration';

@Module({
  imports: [RecordingModule,
    ScheduleModule.forRoot(),
    CronModule,
    ConfigModule.forRoot({
      load:[configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        entities:[VideoMetadata],
        synchronize: configService.get<boolean>('db.synchronize'),
      }),
    }),
    DBModule,
  ],
})
export class AppModule {}
