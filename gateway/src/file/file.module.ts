import { Module } from '@nestjs/common';
import { FileService } from './file.service.js';

@Module({
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
