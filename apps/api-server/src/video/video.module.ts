import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { FileService } from 'src/file/file.service';

@Module({
  providers: [VideoService,FileService],
  controllers:[VideoController]
})
export class VideoModule {}
