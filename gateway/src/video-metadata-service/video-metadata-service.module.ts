import { Module } from '@nestjs/common';
import { VideoMetadataServiceController } from './video-metadata-service.controller';
import { VideoMetadataServiceService } from './video-metadata-service.service';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports:[HttpModule],
  controllers: [VideoMetadataServiceController],
  providers: [VideoMetadataServiceService]
})
export class VideoMetadataServiceModule {}
