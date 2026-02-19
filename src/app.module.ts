import { Module, NestModule,MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { VideosModule } from './videos/videos.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [VideosModule, AuthModule, UsersModule],
})
export class AppModule implements NestModule {
  //라우트 핸들러에 미들웨어 등록
  configure(consumer: MiddlewareConsumer) {
    consumer
    //미들웨어 콘슈머의 경우 보통 플루언트 스타일로 메서드를 체이닝할 수 있다.
    .apply(LoggerMiddleware)
    .forRoutes({path:'videos/*',method: RequestMethod.GET})
  }
}
