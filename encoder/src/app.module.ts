import { Module } from '@nestjs/common';
import { EncodingService } from './encoding/encoding.service';
import { EncodingModule } from './encoding/encoding.module';
import { ConfigModule } from '@nestjs/config';
import { DBModule } from './DB/DB.module';
import configuration from './config/configuration';

@Module({
  imports: [
    EncodingModule,
    DBModule,

    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],

  providers: [EncodingService],
})
export class AppModule {}
