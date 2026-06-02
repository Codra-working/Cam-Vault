import { Module } from '@nestjs/common';
import { getCustomRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { DBService } from './DB.service';
import { ConfigService, ConfigModule } from '@nestjs/config';
import configuration from 'src/config/configuration';
import { Repository } from 'typeorm';

@Module({
    imports: [TypeOrmModule.forRootAsync({
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
    }),],
    providers: [DBService, {provide:'VideoMetadataRepository', useValue: Repository<VideoMetadata>}],
    controllers: [],
    exports: [DBService]
})
export class DBModule { }
