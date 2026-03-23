import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoMetadata } from './videoMetadata.entity';
import { DBService } from './DB.service';

@Module({
    imports:[TypeOrmModule.forFeature([VideoMetadata])],
    providers: [DBService],
    controllers:[],
    exports:[TypeOrmModule]
})
export class DBModule {}
