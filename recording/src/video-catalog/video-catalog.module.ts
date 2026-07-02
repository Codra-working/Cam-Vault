import { Module } from '@nestjs/common';

import { VideoCatalogController } from './video-catalog.controller';
import { DBModule } from 'src/DB/DB.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [DBModule, StorageModule],
  controllers: [VideoCatalogController],
})
export class VideoCatalogModule {}
