import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import configuration from './config/configuration';
import { RecordingController } from './record/recording.controller';
import { EncodingController } from './encode/encoding.controller';
//import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { VideoMetadataServiceModule } from './video-metadata-service/video-metadata-service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    VideoMetadataServiceModule,
  ],
  controllers: [RecordingController, EncodingController],
  providers: [
    {
      provide: 'RECORDING_SERVICE',
      useFactory: (configSerivce: ConfigService) => {
        const recordingSvcOptions = configSerivce.get('recordingSvcOptions');
        return ClientProxyFactory.create(recordingSvcOptions);
      },
      inject: [ConfigService],
    },
  ],
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
