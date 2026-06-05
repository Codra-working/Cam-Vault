import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { DBService } from './DB.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

@Module({
    imports: [TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
            type: 'mysql' as const,
            host: configService.get<string>('db.host'),
            port: configService.get<number>('db.port'),
            username: configService.get<string>('db.username'),
            password: configService.get<string>('db.password'),
            database: configService.get<string>('db.database'),
            entities: [VideoMetadata],
            synchronize: configService.get<boolean>('db.synchronize'),
        }),
    }), TypeOrmModule.forFeature([VideoMetadata])],
    providers: [DBService],
    controllers: [],
    exports: [DBService]
})
export class DBModule { }
