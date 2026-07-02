import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { EncodingController } from './encode/encoding.controller';
//import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { VideoMetadataServiceModule } from './video-metadata-service/video-metadata-service.module';
import { RecordingModule } from './record/recording.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    VideoMetadataServiceModule,
    RecordingModule,
  ],
  controllers: [EncodingController],
})
export class AppModule {} /* implements NestModule {
  //라우트 핸들러에 미들웨어 등록
  configure(consumer: MiddlewareConsumer) {
    consumer
    //미들웨어 콘슈머의 경우 보통 플루언트 스타일로 메서드를 체이닝할 수 있다.
    .apply(LoggerMiddleware)
    .forRoutes({path:'videos/*',method: RequestMethod.GET})
  }
}*/
