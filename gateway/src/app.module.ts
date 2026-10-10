import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { EncodingController } from './encode/encoding.controller';
// import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { VideoMetadataServiceModule } from './video-metadata-service/video-metadata-service.module';
import { RecordingModule } from './record/recording.module';
import { FilterModule } from './filter/filter.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    VideoMetadataServiceModule,
    RecordingModule,
    FilterModule,
  ],
  controllers: [EncodingController],
})
export class AppModule {}
