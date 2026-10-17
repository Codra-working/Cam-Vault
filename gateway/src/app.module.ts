import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration.js';
import { EncodingController } from './encode/encoding.controller.js';
// import { LoggerMiddleware } from './middleware/logger.middleware.js';
import { RecordingModule } from './record/recording.module.js';
import { FilterModule } from './filter/filter.module.js';
import AuthModule from './auth/auth.module.js';
import { UsersService } from './users/users.service.js';
import { UsersModule } from './users/users.module.js';
import VideosModule from './videos/videos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    RecordingModule,
    FilterModule,
    AuthModule,
    UsersModule,
    VideosModule,
  ],
  controllers: [EncodingController],
  providers: [UsersService],
})
export default class AppModule {}
