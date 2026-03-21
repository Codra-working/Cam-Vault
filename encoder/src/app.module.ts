import { Module } from '@nestjs/common';
import { EncodingService } from './encoding/encoding.service';
import { EncodingModule } from './encoding/encoding.module';
import { VideoMetadata } from './DB/videoMetadata.entity';
import { ConfigModule } from '@nestjs/config';
import { DBModule } from './DB/DB.module';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [EncodingModule,DBModule,

    ConfigModule.forRoot(
      {
        isGlobal: true,
        envFilePath: '.env'
      }
    ),    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities:[VideoMetadata],
      synchronize: true,
    }),],
    
  providers: [EncodingService],
})
export class AppModule { }
