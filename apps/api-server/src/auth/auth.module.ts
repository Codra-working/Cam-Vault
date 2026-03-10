import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constatns';
import { UsersModule } from 'src/users/users.module';
import { AuthGuard } from './auth.guard';
import {APP_GUARD} from '@nestjs/core'
@Module({
  imports: [UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions:{expiresIn: '1h'},
    })
  ],
  providers: [AuthService,
    {
      provide:APP_GUARD,
      useClass:AuthGuard
    },
  ],
  controllers: [AuthController],
  exports:[AuthService]
})
export class AuthModule {}
