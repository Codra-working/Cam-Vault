import { Module } from '@nestjs/common';
import { EncodingModule } from './encoding/encoding.module';
import { ConfigModule } from '@nestjs/config';
import { DBModule } from './DB/DB.module';
import configuration from './config/configuration';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    EncodingModule,
    DBModule,
    StorageModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
})
export class AppModule {}
