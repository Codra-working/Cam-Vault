import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DBService } from 'src/DB/DB.service';
import { VideoMetadata } from 'src/DB/videoMetadata.entity';

@Controller('video-catalog')
export class VideoCatalogController {
  constructor(private dbService: DBService) {}
  @MessagePattern({ cmd: 'Get_video-catalog_:streamID' })
  async getVideoCatalogs(
    @Payload('streamID') id: string,
    @Payload('start') start: string,
    @Payload('end') end: string,
  ): Promise<VideoMetadata[]> {
    return await this.dbService.search(id, start, end);
  }
}
