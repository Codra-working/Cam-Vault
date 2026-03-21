import { Module } from '@nestjs/common';
import { EncodingService } from './encoding.service';
import { EncodingController } from './encoding.controller';
import { DBService } from 'src/DB/DB.service';
import { DBModule } from 'src/DB/DB.module';

@Module({
    imports:[DBModule],
    providers:[EncodingService,DBService],
    controllers: [EncodingController]
})
export class EncodingModule {}
