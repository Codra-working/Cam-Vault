import { Module } from '@nestjs/common';
import { EncodingService } from './encoding/encoding.service';
import { EncodingModule } from './encoding/encoding.module';
import { VideoMetadata } from './DB/videoMetadata.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DBModule } from './DB/DB.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';


@Module({
  imports: [EncodingModule,DBModule,

    ConfigModule.forRoot(
      {
        isGlobal: true,
        load:[configuration],
      }
    ),    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        entities:[VideoMetadata],
        synchronize: configService.get<boolean>('db.synchronize'),
      }),
    }),],
    
  providers: [EncodingService],
})
export class AppModule { }
