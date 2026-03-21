import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import configuration from './services/config/configuration';
import { RecordingController } from './recording.controller';
import { EncodingController } from './encoding.controller';
import { DBModule } from './services/DB/DB.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoMetadata } from './services/DB/videoMetadata.entity';
import { VideoController } from './video.controller';
import { DBService } from './services/DB/DB.service';
//import { LoggerMiddleware } from './common/middleware/logger.middleware';


@Module({
  imports: [ConfigModule.forRoot({
    load: [configuration]
  }),
    DBModule, TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [VideoMetadata],
      synchronize: true,
    }),],
  controllers: [RecordingController, EncodingController,VideoController],
  providers: [
    {
      provide: 'RECORDING_SERVICE',
      useFactory: (configSerivce: ConfigService) => {
        const recordingSvcOptions = configSerivce.get('recordingSvcOptions');
        return ClientProxyFactory.create(recordingSvcOptions)
      },
      inject: [ConfigService]
    },
    DBService
  ],
})
export class AppModule { }/* implements NestModule {
  //라우트 핸들러에 미들웨어 등록
  configure(consumer: MiddlewareConsumer) {
    consumer
    //미들웨어 콘슈머의 경우 보통 플루언트 스타일로 메서드를 체이닝할 수 있다.
    .apply(LoggerMiddleware)
    .forRoutes({path:'videos/*',method: RequestMethod.GET})
  }
}*/
